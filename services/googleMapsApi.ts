import { Location } from "@/types/route";

// Use demo API key for testing - replace with your own
const DEMO_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

export async function geocodeAddress(address: string): Promise<Location | null> {
  try {
    // For demo purposes, return mock coordinates
    // In production, use actual Google Geocoding API
    
    // Mock geocoding based on address patterns (German cities)
    const mockCoordinates: { [key: string]: Location } = {
      "restaurant": { lat: 52.5200, lng: 13.4050 }, // Berlin
      "hauptstraße": { lat: 52.5300, lng: 13.4150 },
      "bahnhofstraße": { lat: 52.5100, lng: 13.3950 },
      "kirchstraße": { lat: 52.5400, lng: 13.4250 },
      "marktplatz": { lat: 52.5000, lng: 13.3850 },
      "schillerstraße": { lat: 52.5500, lng: 13.4350 },
      "goethestraße": { lat: 52.4900, lng: 13.3750 },
      "friedrichstraße": { lat: 52.5150, lng: 13.3900 },
      "unter den linden": { lat: 52.5170, lng: 13.3888 },
      "alexanderplatz": { lat: 52.5219, lng: 13.4132 },
      "potsdamer platz": { lat: 52.5096, lng: 13.3760 },
      "kurfürstendamm": { lat: 52.5048, lng: 13.3301 },
      // English addresses for compatibility
      "123 main st": { lat: 52.5249, lng: 13.4094 },
      "456 oak ave": { lat: 52.5149, lng: 13.4294 },
      "789 pine rd": { lat: 52.5049, lng: 13.4394 },
      "321 elm st": { lat: 52.5349, lng: 13.3994 },
      "654 maple dr": { lat: 52.4949, lng: 13.4494 },
    };

    const lowerAddress = address.toLowerCase();
    for (const [key, coords] of Object.entries(mockCoordinates)) {
      if (lowerAddress.includes(key)) {
        return coords;
      }
    }

    // Default coordinates with slight randomization (Berlin area)
    return {
      lat: 52.5200 + (Math.random() - 0.5) * 0.1,
      lng: 13.4050 + (Math.random() - 0.5) * 0.1,
    };

    /* Production code:
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    return null;
    */
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function getDistanceMatrix(
  origins: Location[],
  destinations: Location[]
): Promise<{ distance: number; duration: number }[][]> {
  try {
    // Mock distance matrix for demo
    const matrix: { distance: number; duration: number }[][] = [];
    
    for (let i = 0; i < origins.length; i++) {
      const row: { distance: number; duration: number }[] = [];
      for (let j = 0; j < destinations.length; j++) {
        const origin = origins[i];
        const dest = destinations[j];
        
        // Calculate approximate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (dest.lat - origin.lat) * Math.PI / 180;
        const dLon = (dest.lng - origin.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(origin.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // Estimate duration (assuming 30 km/h average speed in city)
        const duration = Math.round((distance / 30) * 60);
        
        row.push({ distance, duration });
      }
      matrix.push(row);
    }
    
    return matrix;

    /* Production code:
    const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
    const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    const matrix = [];
    for (const row of data.rows) {
      const rowData = row.elements.map(element => ({
        distance: element.distance.value / 1000, // Convert to km
        duration: Math.round(element.duration.value / 60) // Convert to minutes
      }));
      matrix.push(rowData);
    }
    return matrix;
    */
  } catch (error) {
    console.error("Distance matrix error:", error);
    throw error;
  }
}

export async function getDirections(
  origin: Location,
  destination: Location,
  waypoints: Location[] = []
): Promise<{ polyline: Location[]; distance: number; duration: number }> {
  try {
    // Mock directions for demo
    const polyline: Location[] = [origin];
    
    // Add waypoints
    for (const waypoint of waypoints) {
      polyline.push(waypoint);
    }
    
    // Add destination
    polyline.push(destination);
    
    // Calculate total distance and duration
    let totalDistance = 0;
    let totalDuration = 0;
    
    for (let i = 0; i < polyline.length - 1; i++) {
      const matrix = await getDistanceMatrix([polyline[i]], [polyline[i + 1]]);
      totalDistance += matrix[0][0].distance;
      totalDuration += matrix[0][0].duration;
    }
    
    return { polyline, distance: totalDistance, duration: totalDuration };

    /* Production code:
    const waypointsStr = waypoints.map(w => `${w.lat},${w.lng}`).join('|');
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&waypoints=${waypointsStr}&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.routes.length > 0) {
      const route = data.routes[0];
      const polyline = decodePolyline(route.overview_polyline.points);
      
      let totalDistance = 0;
      let totalDuration = 0;
      
      for (const leg of route.legs) {
        totalDistance += leg.distance.value / 1000;
        totalDuration += Math.round(leg.duration.value / 60);
      }
      
      return { polyline, distance: totalDistance, duration: totalDuration };
    }
    throw new Error('No route found');
    */
  } catch (error) {
    console.error("Directions error:", error);
    throw error;
  }
}