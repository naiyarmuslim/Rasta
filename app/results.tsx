import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Navigation, 
  Clock, 
  Share2, 
  CheckCircle,
  XCircle,
  User,
  Route
} from "lucide-react-native";
import { useRoute } from "@/providers/RouteProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { MapComponent } from "@/components/MapComponent";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ResultsScreen() {
  const { routeData } = useRoute();
  const { t, formatTime } = useLanguage();
  const [selectedDriver, setSelectedDriver] = useState(0);

  const mapRegion = useMemo(() => {
    if (!routeData?.routes?.length) return null;
    
    const allCoords = routeData.routes.flatMap(route => [
      route.restaurant.location,
      ...route.stops.map(stop => stop.location)
    ]);

    const lats = allCoords.map(c => c.lat);
    const lngs = allCoords.map(c => c.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.3,
      longitudeDelta: (maxLng - minLng) * 1.3,
    };
  }, [routeData]);

  const shareRoute = async (driverIndex: number) => {
    if (!routeData) return;
    
    const route = routeData.routes[driverIndex];
    const stops = [route.restaurant.address, ...route.stops.map(s => s.address)];
    const googleMapsUrl = `https://www.google.com/maps/dir/${stops.join('/')}`;
    
    const message = `Driver ${driverIndex + 1} Route:\n\n` +
      `Start: ${route.restaurant.address}\n` +
      route.stops.map((stop, i) => 
        `${i + 1}. ${stop.address} (ETA: ${formatTime(stop.eta)})`
      ).join('\n') +
      `\n\nTotal Distance: ${route.totalDistance.toFixed(1)} km\n` +
      `Total Time: ${route.totalTime} min\n\n` +
      `Open in Google Maps: ${googleMapsUrl}`;

    try {
      await Share.share({
        message,
        title: `Rasta - ${t('driverRoute', { number: driverIndex + 1 })}`,
      });
    } catch {
      Alert.alert(t('error'), t('failedToShare'));
    }
  };

  const savePlan = async () => {
    try {
      const planData = JSON.stringify(routeData);
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem(`route_plan_${timestamp}`, planData);
      Alert.alert(t('success'), t('routePlanSaved'));
    } catch {
      Alert.alert(t('error'), t('failedToSave'));
    }
  };



  if (!routeData || !routeData.routes.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('noRouteData')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {mapRegion && (
          <View style={styles.mapContainer}>
            <MapComponent
              region={mapRegion}
              routes={routeData.routes}
              colors={COLORS}
            />
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{routeData.routes.length}</Text>
            <Text style={styles.statLabel}>{t('drivers')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {routeData.routes.reduce((sum, r) => sum + r.stops.length, 0)}
            </Text>
            <Text style={styles.statLabel}>{t('totalOrders')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.max(...routeData.routes.map(r => r.totalTime))}
            </Text>
            <Text style={styles.statLabel}>{t('maxTimeMin')}</Text>
          </View>
        </View>

        <View style={styles.validationContainer}>
          {routeData.validation.directionOptimized && (
            <View style={styles.badge}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.badgeText}>{t('directionOptimized')}</Text>
            </View>
          )}
          {routeData.validation.maxLastRuleValid ? (
            <View style={styles.badge}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.badgeText}>
                {t('maxMinRule', { time: routeData.validation.maxLastDeliveryTime })} ✓
              </Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgeError]}>
              <XCircle size={16} color="#ef4444" />
              <Text style={[styles.badgeText, styles.badgeTextError]}>
                {t('maxMinRule', { time: routeData.validation.maxLastDeliveryTime })} ✗
              </Text>
            </View>
          )}
        </View>

        <View style={styles.driverTabs}>
          {routeData.routes.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.driverTab,
                selectedDriver === index && styles.driverTabActive
              ]}
              onPress={() => setSelectedDriver(index)}
            >
              <User size={16} color={selectedDriver === index ? "#fff" : "#6b7280"} />
              <Text style={[
                styles.driverTabText,
                selectedDriver === index && styles.driverTabTextActive
              ]}>
                {t('drivers')} {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeHeader}>
            <View style={styles.routeHeaderLeft}>
              <Route size={20} color={COLORS[selectedDriver % COLORS.length]} />
              <Text style={styles.routeTitle}>{t('driverRoute', { number: selectedDriver + 1 })}</Text>
            </View>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={() => shareRoute(selectedDriver)}
            >
              <Share2 size={18} color="#10b981" />
            </TouchableOpacity>
          </View>

          <View style={styles.routeStats}>
            <View style={styles.routeStat}>
              <Clock size={14} color="#6b7280" />
              <Text style={styles.routeStatText}>
                {routeData.routes[selectedDriver].totalTime} min
              </Text>
            </View>
            <View style={styles.routeStat}>
              <Navigation size={14} color="#6b7280" />
              <Text style={styles.routeStatText}>
                {routeData.routes[selectedDriver].totalDistance.toFixed(1)} km
              </Text>
            </View>
          </View>

          <View style={styles.stopsList}>
            <View style={styles.stopItem}>
              <View style={styles.stopMarker}>
                <Text style={styles.stopMarkerText}>R</Text>
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.stopAddress}>
                  {routeData.routes[selectedDriver].restaurant.address}
                </Text>
                <Text style={styles.stopTime}>{t('startPoint')}</Text>
              </View>
            </View>

            {routeData.routes[selectedDriver].stops.map((stop, index) => (
              <View key={index} style={styles.stopItem}>
                <View style={[
                  styles.stopMarker,
                  { backgroundColor: COLORS[selectedDriver % COLORS.length] }
                ]}>
                  <Text style={styles.stopMarkerText}>{index + 1}</Text>
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopAddress}>{stop.address}</Text>
                  <View style={styles.stopMeta}>
                    <Text style={styles.stopTime}>
                      {t('eta')}: {formatTime(stop.eta)}
                    </Text>
                    <Text style={styles.stopDuration}>
                      {stop.legDuration} {t('minFromPrevious')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={savePlan}>
            <Text style={styles.actionButtonText}>{t('savePlan')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => shareRoute(selectedDriver)}
          >
            <Share2 size={18} color="#fff" />
            <Text style={styles.actionButtonTextPrimary}>{t('shareToDriver')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 16,
  },
  mapContainer: {
    height: 250,
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#10b981",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  validationContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#064e3b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeError: {
    backgroundColor: "#7f1d1d",
  },
  badgeText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "500" as const,
  },
  badgeTextError: {
    color: "#ef4444",
  },
  driverTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  driverTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1a1a1a",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  driverTabActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  driverTabText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "500" as const,
  },
  driverTabTextActive: {
    color: "#fff",
  },
  routeCard: {
    marginHorizontal: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  routeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#fff",
  },
  shareButton: {
    padding: 8,
  },
  routeStats: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },
  routeStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  routeStatText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  stopsList: {
    gap: 16,
  },
  stopItem: {
    flexDirection: "row",
    gap: 12,
  },
  stopMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6b7280",
    justifyContent: "center",
    alignItems: "center",
  },
  stopMarkerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold" as const,
  },
  stopInfo: {
    flex: 1,
  },
  stopAddress: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
  },
  stopMeta: {
    flexDirection: "row",
    gap: 12,
  },
  stopTime: {
    color: "#10b981",
    fontSize: 12,
  },
  stopDuration: {
    color: "#6b7280",
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  actionButtonPrimary: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500" as const,
  },
  actionButtonTextPrimary: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500" as const,
  },

});