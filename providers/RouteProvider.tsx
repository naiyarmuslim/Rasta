import React, { useState, useEffect, ReactNode } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteData, RouteConfig } from "@/types/route";

const DEFAULT_CONFIG: RouteConfig = {
  googleMapsApiKey: "",
  maxDirectionAngle: 35,
  maxLastDeliveryTime: 20,
  extendedLastDeliveryTime: 40,
};

export const [RouteProvider, useRoute] = createContextHook(() => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [config, setConfig] = useState<RouteConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem('routeConfig');
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };

  const updateConfig = (newConfig: RouteConfig) => {
    setConfig(newConfig);
  };

  return {
    routeData,
    setRouteData,
    config,
    updateConfig,
  };
});