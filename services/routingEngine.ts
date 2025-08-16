import { 
  Location, 
  Order, 
  DriverRoute, 
  RouteData, 
  RouteRequest,
  Stop 
} from "@/types/route";
import { getDistanceMatrix, getDirections } from "./googleMapsApi";

// Calculate bearing between two points
function calculateBearing(from: Location, to: Location): number {
  const dLon = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - 
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

// Check if two bearings are in the same direction
function isSameDirection(bearing1: number, bearing2: number, maxAngle: number = 35): boolean {
  const diff = Math.abs(bearing1 - bearing2);
  return Math.min(diff, 360 - diff) <= maxAngle;
}

// Single driver routing algorithm
async function routeSingleDriver(
  restaurant: Location,
  orders: Order[],
  maxLastDeliveryTime: number
): Promise<DriverRoute> {
  const unvisited = [...orders];
  const route: Stop[] = [];
  let currentLocation = restaurant;
  let currentTime = 0;
  let totalDistance = 0;
  
  // Find nearest order from restaurant
  const distanceMatrix = await getDistanceMatrix([restaurant], orders.map(o => o.location));
  let nearestIndex = 0;
  let nearestDuration = distanceMatrix[0][0].duration;
  
  for (let i = 1; i < distanceMatrix[0].length; i++) {
    if (distanceMatrix[0][i].duration < nearestDuration) {
      nearestIndex = i;
      nearestDuration = distanceMatrix[0][i].duration;
    }
  }
  
  // Add first stop
  const firstStop = unvisited[nearestIndex];
  currentTime += nearestDuration;
  totalDistance += distanceMatrix[0][nearestIndex].distance;
  
  route.push({
    ...firstStop,
    eta: new Date(Date.now() + currentTime * 60000).toISOString(),
    legDuration: nearestDuration,
    legDistance: distanceMatrix[0][nearestIndex].distance,
  });
  
  currentLocation = firstStop.location;
  unvisited.splice(nearestIndex, 1);
  
  // Route remaining orders with direction preference
  while (unvisited.length > 0) {
    const currentBearing = route.length > 0 
      ? calculateBearing(
          route.length === 1 ? restaurant : route[route.length - 2].location,
          currentLocation
        )
      : 0;
    
    const matrix = await getDistanceMatrix([currentLocation], unvisited.map(o => o.location));
    
    // Score each unvisited order
    const scores = unvisited.map((order, index) => {
      const bearing = calculateBearing(currentLocation, order.location);
      const directionBonus = isSameDirection(currentBearing, bearing) ? 0.8 : 1.0;
      return {
        index,
        score: matrix[0][index].duration * directionBonus,
        duration: matrix[0][index].duration,
        distance: matrix[0][index].distance,
      };
    });
    
    // Sort by score and pick the best
    scores.sort((a, b) => a.score - b.score);
    const best = scores[0];
    
    // Check if adding this order violates max last delivery time
    const projectedTime = currentTime + best.duration;
    if (projectedTime > maxLastDeliveryTime && unvisited.length === 1) {
      console.warn(`Last delivery will exceed ${maxLastDeliveryTime} minutes`);
    }
    
    // Add to route
    const nextStop = unvisited[best.index];
    currentTime += best.duration;
    totalDistance += best.distance;
    
    route.push({
      ...nextStop,
      eta: new Date(Date.now() + currentTime * 60000).toISOString(),
      legDuration: best.duration,
      legDistance: best.distance,
    });
    
    currentLocation = nextStop.location;
    unvisited.splice(best.index, 1);
  }
  
  // Get polyline for visualization
  const directions = await getDirections(
    restaurant,
    route[route.length - 1].location,
    route.slice(0, -1).map(s => s.location)
  );
  
  return {
    driverId: 0,
    restaurant: { address: "", location: restaurant },
    stops: route,
    totalDistance,
    totalTime: currentTime,
    polyline: directions.polyline,
  };
}

// Cluster orders for multiple drivers
function clusterOrders(orders: Order[], numClusters: number): Order[][] {
  if (numClusters === 1) return [orders];
  
  // Simple geographic clustering based on bearing from center
  const centerLat = orders.reduce((sum, o) => sum + o.location.lat, 0) / orders.length;
  const centerLng = orders.reduce((sum, o) => sum + o.location.lng, 0) / orders.length;
  const center: Location = { lat: centerLat, lng: centerLng };
  
  // Calculate bearing for each order from center
  const ordersWithBearing = orders.map(order => ({
    order,
    bearing: calculateBearing(center, order.location),
  }));
  
  // Sort by bearing
  ordersWithBearing.sort((a, b) => a.bearing - b.bearing);
  
  // Divide into clusters
  const clusters: Order[][] = Array(numClusters).fill(null).map(() => []);
  const ordersPerCluster = Math.ceil(orders.length / numClusters);
  
  ordersWithBearing.forEach((item, index) => {
    const clusterIndex = Math.floor(index / ordersPerCluster);
    if (clusterIndex < numClusters) {
      clusters[clusterIndex].push(item.order);
    }
  });
  
  return clusters.filter(c => c.length > 0);
}

// Main routing optimization function
export async function optimizeRoutes(request: RouteRequest): Promise<RouteData> {
  const { restaurant, orders, numberOfDrivers, minutesUntilClose } = request;
  
  // Determine max last delivery time
  const maxLastDeliveryTime = 
    numberOfDrivers === 1 && minutesUntilClose <= 30 ? 40 : 20;
  
  let routes: DriverRoute[] = [];
  
  if (numberOfDrivers === 1) {
    // Single driver optimization
    const route = await routeSingleDriver(
      restaurant.location,
      orders,
      maxLastDeliveryTime
    );
    route.restaurant = restaurant;
    routes = [route];
  } else {
    // Multiple drivers optimization
    const clusters = clusterOrders(orders, numberOfDrivers);
    
    routes = await Promise.all(
      clusters.map(async (clusterOrders, index) => {
        const route = await routeSingleDriver(
          restaurant.location,
          clusterOrders,
          20 // Always use 20 minutes for multiple drivers
        );
        route.driverId = index;
        route.restaurant = restaurant;
        return route;
      })
    );
  }
  
  // Validate routes
  const maxTime = Math.max(...routes.map(r => r.totalTime));
  const validation = {
    directionOptimized: true, // We always apply direction optimization
    maxLastRuleValid: maxTime <= maxLastDeliveryTime,
    maxLastDeliveryTime,
  };
  
  return {
    routes,
    validation,
    timestamp: new Date().toISOString(),
  };
}

// 2-opt improvement for route optimization
export function twoOptImprovement(route: Stop[]): Stop[] {
  // Implementation of 2-opt algorithm for route improvement
  // This is a simplified version for demo purposes
  
  let improved = true;
  const improvedRoute = [...route];
  
  while (improved) {
    improved = false;
    
    for (let i = 0; i < improvedRoute.length - 2; i++) {
      for (let j = i + 2; j < improvedRoute.length; j++) {
        // Try swapping edges
        const currentDistance = 
          calculateDistance(improvedRoute[i].location, improvedRoute[i + 1].location) +
          calculateDistance(improvedRoute[j - 1].location, improvedRoute[j].location);
        
        const newDistance = 
          calculateDistance(improvedRoute[i].location, improvedRoute[j - 1].location) +
          calculateDistance(improvedRoute[i + 1].location, improvedRoute[j].location);
        
        if (newDistance < currentDistance) {
          // Reverse the route between i+1 and j-1
          const reversed = improvedRoute.slice(i + 1, j).reverse();
          improvedRoute.splice(i + 1, j - i - 1, ...reversed);
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }
  
  return improvedRoute;
}

// Helper function to calculate distance
function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}