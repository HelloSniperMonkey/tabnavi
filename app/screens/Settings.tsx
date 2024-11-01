import { Text, View, StyleSheet, Switch, TouchableOpacity, SafeAreaView } from "react-native";
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { signOut } from "firebase/auth";
import { Firebase_Auth } from "../../FirebaseConfig";
import { useNavigation } from "@react-navigation/native";

export default function Index() {
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const toggleSwitch = () => setIsSyncEnabled(previousState => !previousState);

  const Logout = async () => {
    try {
      setIsLoading(true);
      await signOut(Firebase_Auth);
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Logout Error', 'An error occurred while logging out. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

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
      
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={Logout}
        >
          <Text style={styles.primaryButtonText}>Logout</Text>
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
  bottomContainer: {
    padding: 16,
    paddingBottom: 16, // Adjust this value based on your bottom tab height
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
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});