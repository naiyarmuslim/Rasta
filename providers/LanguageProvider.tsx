import { useState, useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = 'en' | 'de';

interface Translations {
  [key: string]: {
    en: string;
    de: string;
  };
}

const translations: Translations = {
  // App Title
  appTitle: {
    en: "Rasta",
    de: "Rasta"
  },
  appSubtitle: {
    en: "Delivery Route Optimizer",
    de: "Lieferrouten-Optimierer"
  },
  
  // Main Screen
  restaurantDetails: {
    en: "Restaurant Details",
    de: "Restaurant-Details"
  },
  restaurantAddress: {
    en: "Restaurant Address",
    de: "Restaurant-Adresse"
  },
  drivers: {
    en: "Drivers",
    de: "Fahrer"
  },
  closingTime: {
    en: "Closing Time",
    de: "Schließzeit"
  },
  minutesUntilClose: {
    en: "min until close",
    de: "Min bis Schließung"
  },
  orderAddresses: {
    en: "Order Addresses",
    de: "Bestelladressen"
  },
  orderAddress: {
    en: "Order {{number}} Address",
    de: "Bestellung {{number}} Adresse"
  },
  addOrder: {
    en: "Add Order",
    de: "Bestellung hinzufügen"
  },
  computeBestRoutes: {
    en: "Compute Best Routes",
    de: "Beste Routen berechnen"
  },
  
  // Results Screen
  optimizedRoutes: {
    en: "Optimized Routes",
    de: "Optimierte Routen"
  },
  mapViewMobile: {
    en: "Map view available on mobile",
    de: "Kartenansicht auf Mobilgerät verfügbar"
  },
  scanQrCode: {
    en: "Scan QR code to view interactive map with routes",
    de: "QR-Code scannen für interaktive Karte mit Routen"
  },
  totalOrders: {
    en: "Total Orders",
    de: "Gesamtbestellungen"
  },
  maxTimeMin: {
    en: "Max Time (min)",
    de: "Max. Zeit (Min)"
  },
  directionOptimized: {
    en: "Direction Optimized",
    de: "Richtungsoptimiert"
  },
  maxMinRule: {
    en: "Max {{time}} min Rule",
    de: "Max. {{time}} Min Regel"
  },
  driverRoute: {
    en: "Driver {{number}} Route",
    de: "Fahrer {{number}} Route"
  },
  startPoint: {
    en: "Start Point",
    de: "Startpunkt"
  },
  eta: {
    en: "ETA",
    de: "Ankunft"
  },
  minFromPrevious: {
    en: "min from previous",
    de: "Min vom vorherigen"
  },
  savePlan: {
    en: "Save Plan",
    de: "Plan speichern"
  },
  shareToDriver: {
    en: "Share to Driver",
    de: "An Fahrer teilen"
  },
  
  // Errors and Messages
  error: {
    en: "Error",
    de: "Fehler"
  },
  success: {
    en: "Success",
    de: "Erfolg"
  },
  enterRestaurantAddress: {
    en: "Please enter the restaurant address",
    de: "Bitte geben Sie die Restaurant-Adresse ein"
  },
  addAtLeastOneOrder: {
    en: "Please add at least one order address",
    de: "Bitte fügen Sie mindestens eine Bestelladresse hinzu"
  },
  driversAtLeastOne: {
    en: "Number of drivers must be at least 1",
    de: "Anzahl der Fahrer muss mindestens 1 sein"
  },
  couldNotGeocode: {
    en: "Could not geocode restaurant address",
    de: "Restaurant-Adresse konnte nicht geocodiert werden"
  },
  couldNotGeocodeOrder: {
    en: "Could not geocode order address: {{address}}",
    de: "Bestelladresse konnte nicht geocodiert werden: {{address}}"
  },
  failedToOptimize: {
    en: "Failed to optimize routes",
    de: "Routen konnten nicht optimiert werden"
  },
  failedToShare: {
    en: "Failed to share route",
    de: "Route konnte nicht geteilt werden"
  },
  routePlanSaved: {
    en: "Route plan saved successfully",
    de: "Routenplan erfolgreich gespeichert"
  },
  failedToSave: {
    en: "Failed to save route plan",
    de: "Routenplan konnte nicht gespeichert werden"
  },
  noRouteData: {
    en: "No route data available",
    de: "Keine Routendaten verfügbar"
  },
  
  // Settings
  language: {
    en: "Language",
    de: "Sprache"
  },
  english: {
    en: "English",
    de: "Englisch"
  },
  german: {
    en: "German",
    de: "Deutsch"
  }
};

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem('language');
      if (stored && (stored === 'en' || stored === 'de')) {
        setLanguage(stored as Language);
      }
    } catch (error) {
      console.error("Failed to load language:", error);
    }
  };

  const changeLanguage = useCallback(async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem('language', newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  }, []);

  const t = useCallback((key: string, params?: { [key: string]: string | number }) => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    let text = translation[language] || translation.en;
    
    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{{${param}}}`, String(value));
      });
    }
    
    return text;
  }, [language]);

  const formatTime = useCallback((date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (language === 'de') {
      // German: 24-hour format
      return dateObj.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
    } else {
      // English: 12-hour format with AM/PM
      return dateObj.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    }
  }, [language]);

  const formatDate = useCallback((date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (language === 'de') {
      return dateObj.toLocaleDateString('de-DE');
    } else {
      return dateObj.toLocaleDateString('en-US');
    }
  }, [language]);

  return useMemo(() => ({
    language,
    changeLanguage,
    t,
    formatTime,
    formatDate
  }), [language, changeLanguage, t, formatTime, formatDate]);
});