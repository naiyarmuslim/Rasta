import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useLanguage } from '@/providers/LanguageProvider';
import { MapComponentProps } from './MapComponent';

export function MapComponent({ region, routes, colors }: MapComponentProps) {
  const { t } = useLanguage();
  
  return (
    <View style={styles.webMapPlaceholder}>
      <MapPin size={48} color="#6b7280" />
      <Text style={styles.webMapText}>{t('mapViewMobile')}</Text>
      <Text style={styles.webMapSubtext}>
        {t('scanQrCode')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webMapPlaceholder: {
    height: 250,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  webMapText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500" as const,
    marginTop: 8,
  },
  webMapSubtext: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});