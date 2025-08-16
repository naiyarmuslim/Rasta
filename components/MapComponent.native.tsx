import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { MapComponentProps } from './MapComponent';

export function MapComponent({ region, routes, colors }: MapComponentProps) {
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={styles.map}
      initialRegion={region}
    >
      {routes.map((route, driverIndex) => (
        <React.Fragment key={driverIndex}>
          <Marker
            coordinate={{
              latitude: route.restaurant.location.lat,
              longitude: route.restaurant.location.lng,
            }}
            title="Restaurant"
            description={route.restaurant.address}
          />
          
          {route.stops.map((stop, stopIndex) => (
            <Marker
              key={`${driverIndex}-${stopIndex}`}
              coordinate={{
                latitude: stop.location.lat,
                longitude: stop.location.lng,
              }}
              title={`Driver ${driverIndex + 1} - Stop ${stopIndex + 1}`}
              description={stop.address}
              pinColor={colors[driverIndex % colors.length]}
            />
          ))}
          
          {route.polyline && (
            <Polyline
              coordinates={route.polyline.map(point => ({
                latitude: point.lat,
                longitude: point.lng,
              }))}
              strokeColor={colors[driverIndex % colors.length]}
              strokeWidth={3}
            />
          )}
        </React.Fragment>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});