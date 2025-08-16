import { Platform } from 'react-native';

export interface MapComponentProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  routes: {
    restaurant: {
      location: { lat: number; lng: number };
      address: string;
    };
    stops: {
      location: { lat: number; lng: number };
      address: string;
    }[];
    polyline?: { lat: number; lng: number }[];
  }[];
  colors: string[];
}

// Platform-specific component loading
/* eslint-disable @typescript-eslint/no-require-imports */
const MapComponent = Platform.select({
  web: () => require('./MapComponent.web').MapComponent,
  default: () => require('./MapComponent.native').MapComponent,
})();
/* eslint-enable @typescript-eslint/no-require-imports */

export { MapComponent };