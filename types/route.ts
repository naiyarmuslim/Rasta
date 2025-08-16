export interface Location {
  lat: number;
  lng: number;
}

export interface Address {
  address: string;
  location: Location;
}

export interface Order extends Address {
  id: string;
}

export interface Stop extends Order {
  eta: string;
  legDuration: number;
  legDistance: number;
}

export interface DriverRoute {
  driverId: number;
  restaurant: Address;
  stops: Stop[];
  totalDistance: number;
  totalTime: number;
  polyline?: Location[];
}

export interface RouteData {
  routes: DriverRoute[];
  validation: {
    directionOptimized: boolean;
    maxLastRuleValid: boolean;
    maxLastDeliveryTime: number;
  };
  timestamp: string;
}

export interface RouteConfig {
  googleMapsApiKey: string;
  maxDirectionAngle: number;
  maxLastDeliveryTime: number;
  extendedLastDeliveryTime: number;
}

export interface RouteRequest {
  restaurant: Address;
  orders: Order[];
  numberOfDrivers: number;
  minutesUntilClose: number;
  closingTime: string;
}