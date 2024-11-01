import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import Hex from 'crypto-js/enc-hex';
import WordArray from 'crypto-js/lib-typedarrays';
import CryptoJS from 'crypto-js';
import React, { useState , useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet , Alert } from "react-native";
import { usePassword, MasterPassword } from '../components/PasswordContext';
import uuid from 'react-native-uuid';
import * as SecureStore from 'expo-secure-store';
import { Firebase_Auth, Firebase_DB } from "../../FirebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import NetInfo from "@react-native-community/netinfo";

function PasswordForm({ navigation }) {
  const { passwords, setPasswords } = usePassword();
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);

  const encrypt = (data = '', encryptionKey = '') => {
    const initializationVector = WordArray.random(16);
  
    // Encrypt the data
    const encrypted = AES.encrypt(data, Utf8.parse(encryptionKey), {
      iv: initializationVector,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
  
    return `${initializationVector.toString(Hex)}:${encrypted.toString()}`;
  };

  const generatePassword = (options = {}) => {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true
    } = options;

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  };

  const checkPasswordStrength = (password) => {
    let score = 0;

    // Length check
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;

    // Character variety
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    return {
      score,
      strength: score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong',
    };
  };

  const SECURE_STORE_KEY = 'encrypted_passwords';

  interface PasswordData {
    id?: number;
    userId: string;
    website: string;
    username: string;
    encryptedpassword: string;
    encryptedEncryptionKey: string;
  }

  const savePassword = async () => {
    if (website && username && password) {
      try {
        const currentUser = Firebase_Auth.currentUser;
        if (!currentUser) {
          Alert.alert("Error", "You must be logged in to save passwords");
          return;
        }
  
        const encryptionkey = uuid.v4();
        const encryptedpassword = encrypt(password, encryptionkey);
        const encryptedEncryptionKey = encrypt(encryptionkey, MasterPassword);
        
        const passwordData: PasswordData = {
          id: passwords.length+1,
          userId: currentUser.uid,
          website,
          username,
          encryptedpassword,
          encryptedEncryptionKey
        };

        if(isSyncEnabled){
          // Save to Firestore
          const passwordsRef = collection(Firebase_DB, "passwords");
          const docRef = await addDoc(passwordsRef, passwordData);
          const savedPasswordData = { ...passwordData, id: docRef.id };
        }
        // console.log(passwordData);
        
        // Save to SecureStore
        await saveToSecureStore(passwordData);
  
        // Update local state
        setPasswords(prevPasswords => [...prevPasswords, passwordData]);
  
        // Show success message
        Alert.alert("Success", "Password saved successfully");
  
        // Navigate back
        navigation.goBack();
      } catch (error) {
        console.error("Error saving password:", error);
        Alert.alert(
          "Error",
          "Failed to save password. Please try again."
        );
      }
    } else {
      Alert.alert(
        "Validation Error",
        "Please fill in all fields (website, username, and password)"
      );
    }
  };
  
  // Save to SecureStore
const saveToSecureStore = async (newPassword: PasswordData) => {
  try {
    // Get existing passwords
    const existingData = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    let passwords = existingData ? JSON.parse(existingData) : [];

    // Add new password
    passwords.push(newPassword);

    // Save back to SecureStore
    await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify(passwords));
    console.log(passwords);
  } catch (error) {
    console.error("Error saving to SecureStore:", error);
    throw error;
  }
};

// Fetch passwords from both stores and sync them
const fetchPasswords = async () => {
  try {
    // const currentUser = Firebase_Auth.currentUser;
    // if (!currentUser) {
    //   return;
    // }

    // // Fetch from Firestore
    // const passwordsRef = collection(Firebase_DB, "passwords");
    // const q = query(passwordsRef, where("userId", "==", currentUser.uid));
    // const querySnapshot = await getDocs(q);
    
    // const firestorePasswords = querySnapshot.docs.map(doc => ({
    //   id: doc.id,
    //   ...doc.data()
    // })) as PasswordData[];

    // Fetch from SecureStore
    const secureStoreData = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    const secureStorePasswords = secureStoreData ? JSON.parse(secureStoreData) as PasswordData[] : [];
     
    setPasswords(secureStorePasswords);
    console.log(secureStorePasswords);
    // // Sync passwords
    // await syncPasswords(firestorePasswords, secureStorePasswords);

    // // Update local state with Firestore data
    // setPasswords(firestorePasswords);
  } catch (error) {
    console.error("Error fetching passwords:", error);
    Alert.alert(
      "Error",
      "Failed to fetch passwords. Please try again."
    );
  }
};

// Sync passwords between Firestore and SecureStore
const syncPasswords = async (firestorePasswords: PasswordData[], secureStorePasswords: PasswordData[]) => {
  try {
    // Use Firestore as source of truth
    await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify(firestorePasswords));
  } catch (error) {
    console.error("Error syncing passwords:", error);
    throw error;
  }
};

// Delete password from both stores
const deletePassword = async (passwordId: string) => {
  try {
    // const currentUser = Firebase_Auth.currentUser;
    // if (!currentUser) {
    //   return;
    // }

    // // Delete from Firestore
    // await deleteDoc(doc(Firebase_DB, "passwords", passwordId));

    // Delete from SecureStore
    const secureStoreData = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (secureStoreData) {
      const passwords = JSON.parse(secureStoreData) as PasswordData[];
      const updatedPasswords = passwords.filter(p => p.id !== passwordId);
      await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify(updatedPasswords));
    }

    // Update local state
    setPasswords(prevPasswords => prevPasswords.filter(p => p.id !== passwordId));

    Alert.alert("Success", "Password deleted successfully");
  } catch (error) {
    console.error("Error deleting password:", error);
    Alert.alert("Error", "Failed to delete password. Please try again.");
  }
};

// Check for offline changes and sync when coming online
const checkAndSyncOfflineChanges = async () => {
  try {
    const currentUser = Firebase_Auth.currentUser;
    if (!currentUser) {
      return;
    }

    const secureStoreData = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (!secureStoreData) {
      return;
    }

    await fetchPasswords(); // This will handle the sync
  } catch (error) {
    console.error("Error checking offline changes:", error);
  }
};

// Add this to your component's useEffect
useEffect(() => {
  const fetchPasswordsAsync = async () => {
    await fetchPasswords();
  };

  fetchPasswordsAsync();
  
  // Optional: Set up network status listener to sync when coming online
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      checkAndSyncOfflineChanges();
    }
  });

  return () => {
    unsubscribe();
  };
}, [500]); // Empty dependency array means this runs once on mount


  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, strength: 'weak', suggestions: [] });

  const generateAndSetPassword = () => {
    const newPassword = generatePassword();
    setPassword(newPassword);
    setGeneratedPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Add a Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Website"
          value={website}
          onChangeText={setWebsite}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.generateButton, { marginLeft: 10 }]}
            onPress={generateAndSetPassword}
          >
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.passwordStrength, { color: passwordStrength.strength === 'weak' ? 'red' : passwordStrength.strength === 'medium' ? 'orange' : 'green' }]}>
          Password Strength: {passwordStrength.strength}
        </Text>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={savePassword}
        >
          <Text style={styles.submitButtonText}>Add Password</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default PasswordForm;

export const styles = StyleSheet.create({
  // ... [styles remain exactly the same as in your original code]
  container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#f4f6f9',
  },
  content: {
      alignItems: 'center',
      paddingVertical: 20,
  },
  heading: {
      fontSize: 26,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 10,
  },
  subHeading: {
      fontSize: 18,
      fontWeight: '600',
      color: '#666',
      marginBottom: 15,
      textAlign: 'center',
  },
  table: {
      width: '100%',
      marginVertical: 10,
  },
  noData: {
      fontSize: 16,
      color: '#999',
      textAlign: 'center',
      marginVertical: 20,
  },
  passwordItem: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 15,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
  },
  listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
  },
  listLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: '#555',
      width: '25%',
  },
  listValue: {
      fontSize: 16,
      color: '#333',
      flex: 1,
  },
  copyIcon: {
      marginLeft: 8,
  },
  buttonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 10,
  },
  editButton: {
      backgroundColor: '#4caf50',
      borderRadius: 5,
      padding: 8,
      marginRight: 10,
      alignItems: 'center',
  },
  deleteButton: {
      backgroundColor: '#e53935',
      borderRadius: 5,
      padding: 8,
      alignItems: 'center',
  },
  input: {
      width: '100%',
      height: 45,
      borderRadius: 8,
      borderColor: '#ddd',
      borderWidth: 1,
      paddingLeft: 10,
      marginBottom: 12,
      fontSize: 16,
      color: '#333',
      backgroundColor: '#fff',
  },
  submitButton: {
      backgroundColor: '#1976d2',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
      width: '100%',
      marginTop: 10,
  },
  submitButtonText: {
      fontSize: 18,
      color: '#fff',
      fontWeight: '600',
  },
  alert: {
      fontSize: 14,
      color: '#1976d2',
      marginLeft: 5,
  },
  generateButton: {
      backgroundColor: '#1976d2',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
      width: '35%',
      marginBottom: 12,
  },
  generateButtonText: {
    fontSize: 16,
      color: '#fff',
      fontWeight: '600',
  }
});