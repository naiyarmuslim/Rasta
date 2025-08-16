import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Trash2, Navigation, Clock, Users, MapPin } from "lucide-react-native";
import { router } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute } from "@/providers/RouteProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { optimizeRoutes } from "@/services/routingEngine";
import { geocodeAddress } from "@/services/googleMapsApi";

export default function RoutePlannerScreen() {
  const { setRouteData } = useRoute();
  const { t, formatTime } = useLanguage();
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [numberOfDrivers, setNumberOfDrivers] = useState("1");
  const [closingTime, setClosingTime] = useState(new Date());
  const [orderAddresses, setOrderAddresses] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const addOrderAddress = useCallback(() => {
    setOrderAddresses(prev => [...prev, ""]);
  }, []);

  const removeOrderAddress = useCallback((index: number) => {
    setOrderAddresses(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateOrderAddress = useCallback((index: number, value: string) => {
    setOrderAddresses(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  const getMinutesUntilClose = useCallback(() => {
    const now = new Date();
    const close = new Date(closingTime);
    close.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (close < now) {
      close.setDate(close.getDate() + 1);
    }
    
    return Math.floor((close.getTime() - now.getTime()) / 60000);
  }, [closingTime]);

  const computeRoutes = useCallback(async () => {
    const validOrders = orderAddresses.filter(addr => addr.trim());
    
    if (!restaurantAddress.trim()) {
      Alert.alert(t('error'), t('enterRestaurantAddress'));
      return;
    }
    
    if (validOrders.length === 0) {
      Alert.alert(t('error'), t('addAtLeastOneOrder'));
      return;
    }

    const drivers = parseInt(numberOfDrivers) || 1;
    if (drivers < 1) {
      Alert.alert(t('error'), t('driversAtLeastOne'));
      return;
    }

    setIsLoading(true);
    
    try {
      // Geocode all addresses
      const restaurantCoords = await geocodeAddress(restaurantAddress);
      if (!restaurantCoords) {
        throw new Error(t('couldNotGeocode'));
      }

      const orderCoords = await Promise.all(
        validOrders.map(async (addr, index) => {
          const coords = await geocodeAddress(addr);
          if (!coords) {
            throw new Error(t('couldNotGeocodeOrder', { address: addr }));
          }
          return {
            id: `order_${index}`,
            address: addr,
            location: coords
          };
        })
      );

      const minutesUntilClose = getMinutesUntilClose();
      
      // Optimize routes
      const optimizedRoutes = await optimizeRoutes({
        restaurant: {
          address: restaurantAddress,
          location: restaurantCoords
        },
        orders: orderCoords,
        numberOfDrivers: drivers,
        minutesUntilClose,
        closingTime: closingTime.toISOString()
      });

      setRouteData(optimizedRoutes);
      router.push("/results");
      
    } catch (error) {
      console.error("Route optimization error:", error);
      Alert.alert(
        t('error'), 
        error instanceof Error ? error.message : t('failedToOptimize')
      );
    } finally {
      setIsLoading(false);
    }
  }, [restaurantAddress, orderAddresses, numberOfDrivers, closingTime, setRouteData, getMinutesUntilClose]);



  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>{t('appTitle')}</Text>
            <Text style={styles.subtitle}>{t('appSubtitle')}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Navigation size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>{t('restaurantDetails')}</Text>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder={t('restaurantAddress')}
              placeholderTextColor="#6b7280"
              value={restaurantAddress}
              onChangeText={setRestaurantAddress}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.section, styles.halfSection]}>
              <View style={styles.sectionHeader}>
                <Users size={20} color="#10b981" />
                <Text style={styles.sectionTitle}>{t('drivers')}</Text>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#6b7280"
                value={numberOfDrivers}
                onChangeText={setNumberOfDrivers}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.section, styles.halfSection]}>
              <View style={styles.sectionHeader}>
                <Clock size={20} color="#10b981" />
                <Text style={styles.sectionTitle}>{t('closingTime')}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>{formatTime(closingTime)}</Text>
                <Text style={styles.minutesText}>
                  {getMinutesUntilClose()} {t('minutesUntilClose')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showTimePicker && Platform.OS === 'ios' && (
            <DateTimePicker
              value={closingTime}
              mode="time"
              display="spinner"
              onChange={(event, date) => {
                setShowTimePicker(false);
                if (date) setClosingTime(date);
              }}
              textColor="#fff"
            />
          )}

          {showTimePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={closingTime}
              mode="time"
              display="default"
              onChange={(event, date) => {
                setShowTimePicker(false);
                if (date) setClosingTime(date);
              }}
            />
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>{t('orderAddresses')}</Text>
            </View>

            {orderAddresses.map((address, index) => (
              <View key={index} style={styles.orderRow}>
                <TextInput
                  style={[styles.input, styles.orderInput]}
                  placeholder={t('orderAddress', { number: index + 1 })}
                  placeholderTextColor="#6b7280"
                  value={address}
                  onChangeText={(text) => updateOrderAddress(index, text)}
                  autoCapitalize="words"
                />
                {orderAddresses.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeOrderAddress(index)}
                  >
                    <Trash2 size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addOrderAddress}>
              <Plus size={20} color="#10b981" />
              <Text style={styles.addButtonText}>{t('addOrder')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.computeButton, isLoading && styles.computeButtonDisabled]}
            onPress={computeRoutes}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Navigation size={20} color="#fff" />
                <Text style={styles.computeButtonText}>{t('computeBestRoutes')}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold" as const,
    color: "#10b981",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfSection: {
    flex: 1,
  },
  timeButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  timeButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500" as const,
  },
  minutesText: {
    fontSize: 12,
    color: "#10b981",
    marginTop: 4,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  orderInput: {
    flex: 1,
    marginBottom: 0,
  },
  deleteButton: {
    padding: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#10b981",
    borderStyle: "dashed" as const,
  },
  addButtonText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "500" as const,
  },
  computeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
  },
  computeButtonDisabled: {
    opacity: 0.6,
  },
  computeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
});