import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Key, Navigation2, Save, Languages, Check } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@/providers/RouteProvider";
import { useLanguage, Language } from "@/providers/LanguageProvider";

export default function SettingsScreen() {
  const { config, updateConfig } = useRoute();
  const { language, changeLanguage, t } = useLanguage();
  const [apiKey, setApiKey] = useState(config.googleMapsApiKey);
  const [maxAngle, setMaxAngle] = useState(config.maxDirectionAngle.toString());
  const [maxLastDelivery, setMaxLastDelivery] = useState(config.maxLastDeliveryTime.toString());
  const [extendedTime, setExtendedTime] = useState(config.extendedLastDeliveryTime.toString());

  const handleLanguageChange = (newLanguage: Language) => {
    changeLanguage(newLanguage);
  };

  const saveSettings = async () => {
    try {
      const newConfig = {
        googleMapsApiKey: apiKey,
        maxDirectionAngle: parseInt(maxAngle) || 35,
        maxLastDeliveryTime: parseInt(maxLastDelivery) || 20,
        extendedLastDeliveryTime: parseInt(extendedTime) || 40,
      };

      await AsyncStorage.setItem('routeConfig', JSON.stringify(newConfig));
      updateConfig(newConfig);
      
      Alert.alert(t('success'), t('routePlanSaved'));
    } catch (error) {
      Alert.alert(t('error'), t('failedToSave'));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Languages size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>{t('language')}</Text>
          </View>
          
          <View style={styles.languageOptions}>
            <TouchableOpacity 
              style={[
                styles.languageOption,
                language === 'en' && styles.languageOptionActive
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={[
                styles.languageText,
                language === 'en' && styles.languageTextActive
              ]}>
                {t('english')}
              </Text>
              {language === 'en' && (
                <Check size={20} color="#10b981" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.languageOption,
                language === 'de' && styles.languageOptionActive
              ]}
              onPress={() => handleLanguageChange('de')}
            >
              <Text style={[
                styles.languageText,
                language === 'de' && styles.languageTextActive
              ]}>
                {t('german')}
              </Text>
              {language === 'de' && (
                <Check size={20} color="#10b981" />
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.hint}>
            {language === 'de' 
              ? 'Deutsche Version verwendet 24-Stunden-Format für Zeiten'
              : 'German version uses 24-hour format for times'
            }
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Key size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>API Configuration</Text>
          </View>
          
          <Text style={styles.label}>Google Maps API Key</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your API key"
            placeholderTextColor="#6b7280"
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            secureTextEntry
          />
          <Text style={styles.hint}>
            Required for geocoding and route optimization
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Navigation2 size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>Routing Parameters</Text>
          </View>
          
          <Text style={styles.label}>Max Direction Angle (degrees)</Text>
          <TextInput
            style={styles.input}
            placeholder="35"
            placeholderTextColor="#6b7280"
            value={maxAngle}
            onChangeText={setMaxAngle}
            keyboardType="number-pad"
          />
          <Text style={styles.hint}>
            Maximum angle difference to consider "same direction"
          </Text>

          <Text style={styles.label}>Max Last Delivery Time (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="20"
            placeholderTextColor="#6b7280"
            value={maxLastDelivery}
            onChangeText={setMaxLastDelivery}
            keyboardType="number-pad"
          />
          <Text style={styles.hint}>
            Normal maximum time for last delivery
          </Text>

          <Text style={styles.label}>Extended Last Delivery Time (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="40"
            placeholderTextColor="#6b7280"
            value={extendedTime}
            onChangeText={setExtendedTime}
            keyboardType="number-pad"
          />
          <Text style={styles.hint}>
            Extended time when close to closing with 1 driver
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Save size={20} color="#fff" />
          <Text style={styles.saveButtonText}>{t('savePlan')}</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Rasta</Text>
          <Text style={styles.infoText}>
            Version 1.0.0{'\n'}
            Delivery Route Optimizer{'\n'}
            © 2025 Rasta
          </Text>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#fff",
  },
  label: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 8,
    marginTop: 16,
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
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    borderRadius: 12,
    padding: 18,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  infoSection: {
    marginTop: 40,
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  languageOptions: {
    gap: 12,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  languageOptionActive: {
    borderColor: "#10b981",
    backgroundColor: "#064e3b",
  },
  languageText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500" as const,
  },
  languageTextActive: {
    color: "#10b981",
  },
});