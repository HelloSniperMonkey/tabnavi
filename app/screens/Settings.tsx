import { Text, View, StyleSheet, Switch, TouchableOpacity, SafeAreaView } from "react-native";
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { signOut } from "firebase/auth";
import { Firebase_Auth } from "../../FirebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { useKey, usePassword } from '../components/PasswordContext';
import { useAuth } from '../components/AuthContext'
import { useSyncWithContext } from '../components/useSyncWithContext';
import { checkDataBreaches } from '../components/DataBreach';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_BREACH_CHECK_KEY = 'last_breach_check';

export default function Index() {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { passwords, updateBreachResults , clearPasswords} = usePassword();
  const { clearKeys } = useKey();
  const { clearAuthKeys } = useAuth();
  const { isSyncEnabled, setSyncEnabled, isOnline, lastSyncTime, syncPasswords } = useSyncWithContext();

  const toggleSwitch = () => setSyncEnabled(!isSyncEnabled);

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
          <View style={styles.syncInfo}>
            <Text style={styles.label}>Cloud Sync</Text>
            <Text style={styles.syncStatus}>
              {isSyncEnabled ? (isOnline ? '🟢 Online' : '🟡 Offline') : '🔴 Disabled'}
            </Text>
            {lastSyncTime && isSyncEnabled && (
              <Text style={styles.lastSync}>
                Last sync: {lastSyncTime.toLocaleTimeString()}
              </Text>
            )}
          </View>
          <Switch
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={isSyncEnabled ? "#ffffff" : "#f4f3f4"}
            onValueChange={toggleSwitch}
            value={isSyncEnabled}
          />
        </View>
        
        {isSyncEnabled && (
          <View style={styles.syncDescription}>
            <Text style={styles.descriptionText}>
              When enabled, your passwords are securely synced to the cloud. 
              All data is encrypted end-to-end before leaving your device.
            </Text>
            <TouchableOpacity
              style={[styles.syncButton, !isOnline && styles.disabledButton]}
              onPress={async () => {
                if (isOnline) {
                  setIsLoading(true);
                  try {
                    await syncPasswords();
                    Alert.alert('Success', 'Passwords synced successfully');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to sync passwords');
                  } finally {
                    setIsLoading(false);
                  }
                } else {
                  Alert.alert('Offline', 'Please check your internet connection');
                }
              }}
              disabled={!isOnline || isLoading}
            >
              <Text style={styles.syncButtonText}>
                {isLoading ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  syncInfo: {
    flex: 1,
  },
  syncStatus: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  lastSync: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  syncDescription: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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