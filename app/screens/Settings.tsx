import { Text, View, StyleSheet, Switch, TouchableOpacity, SafeAreaView } from "react-native";
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { signOut } from "firebase/auth";
import { Firebase_Auth } from "../../FirebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { useKey, usePassword } from '../components/PasswordContext';
import { useAuth } from '../components/AuthContext'
import { checkDataBreaches } from '../components/DataBreach';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_BREACH_CHECK_KEY = 'last_breach_check';

export default function Index() {
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { passwords, updateBreachResults , clearPasswords} = usePassword();
  const { clearKeys } = useKey();
  const { clearAuthKeys } = useAuth();

  const toggleSwitch = () => setIsSyncEnabled(previousState => !previousState);

  const Logout = async () => {
    try {
        setIsLoading(true);
        await clearAuthKeys();
        await clearPasswords(); // Clear stored passwords
        clearKeys(); // Reset keys to default
        await signOut(Firebase_Auth);
        navigation.navigate('Login');
    } catch (error) {
        Alert.alert('Logout Error', 'An error occurred while logging out. Please try again.');
        console.error(error);
    } finally {
        setIsLoading(false);
    }
};

  const DataBreachChecker = async () => {
    try {
        setIsLoading(true);
        
        // Use the passwords from context
        const results = await checkDataBreaches(passwords);
        
        // Update breach results using context
        await updateBreachResults(results);
        
        // Save last check time
        await AsyncStorage.setItem(LAST_BREACH_CHECK_KEY, Date.now().toString());

        // Notify user of breaches
        const newBreaches = results.filter(result => result.isBreached);
        if (newBreaches.length > 0) {
            Alert.alert(
                "Security Alert",
                `Data breach detected for ${newBreaches.length} account(s). Please consider updating your passwords.`,
                [{ text: "OK" }]
            );
        } else {
            Alert.alert(
                "Security Check Complete",
                "Good news! None of your accounts were found in any known data breaches.",
                [{ text: "OK" }]
            );
        }
    } catch (error) {
        if (error === 'Error: 429') {
            Alert.alert(
                "Rate Limit Exceeded",
                "Too many requests. Please try again after 1 hour.",
                [{ text: "OK" }]
            );
        } else {
            Alert.alert(
                "Error",
                "An error occurred while checking for data breaches. Please try again later.",
                [{ text: "OK" }]
            );
        }
        console.error("Error checking for breaches:", error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.itemContainer}>
          <Text style={styles.label}>Sync</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={isSyncEnabled ? "#ffffff" : "#f4f3f4"}
            onValueChange={toggleSwitch}
            value={isSyncEnabled}
          />
        </View>
      </View>
      <View style={styles.bottomContainer2}>
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={DataBreachChecker}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? "Checking..." : "Check Data Breach Now"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#FF3B30' }, isLoading && styles.disabledButton]}
          onPress={Logout}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? "Loading..." : "Logout"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  contentContainer: {
    padding: 16,
  },
  bottomContainer2: {
    flex: 1,
    padding: 16,
    paddingBottom: 80,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  bottomContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 16,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  label: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});