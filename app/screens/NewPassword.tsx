import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import Hex from 'crypto-js/enc-hex';
import WordArray from 'crypto-js/lib-typedarrays';
import CryptoJS from 'crypto-js';
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePassword, useKey } from '../components/PasswordContext';
import { useSync } from '../components/SyncContext';
import uuid from 'react-native-uuid';
import { Firebase_Auth, Firebase_DB } from "../../FirebaseConfig";
import { collection, addDoc, getDocs, query, where, Firestore } from "firebase/firestore";
import NetInfo from "@react-native-community/netinfo";

function PasswordForm({ navigation }) {
  const { SECURE_STORE_KEY, MasterPassword, mail } = useKey();
  const { passwords, setPasswords } = usePassword();
  const { isSyncEnabled } = useSync();
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState({ score: 0, strength: 'very weak' });

  const encrypt = (data = '', encryptionKey = '') => {
    const initializationVector = WordArray.random(16);

    const encrypted = AES.encrypt(data, encryptionKey, {
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

    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;

    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    return {
      score,
      strength: score < 2 ? 'very weak' : score < 4 ? 'weak' : score < 6 ? 'medium' : 'strong',
    };
  };

  const handlePasswordChange = (newPassword) => {
    setPassword(newPassword);
    const str = checkPasswordStrength(newPassword);
    setStrength(str);
  };

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
          userId: currentUser.uid,
          website,
          username,
          encryptedpassword,
          encryptedEncryptionKey
        };
        let savedPasswordData = passwordData;

        if (isSyncEnabled) {
          const passwordsRef = collection(Firebase_DB, `${mail as string}_passwords`);
          const docRef = await addDoc(passwordsRef, passwordData);
          savedPasswordData = { ...passwordData, id: docRef.id };
        } else {
          savedPasswordData = { ...passwordData, id: uuid.v4(), pendingSync: true };
        }

        await saveToAsyncStorage(savedPasswordData);
        setPasswords(prevPasswords => [...prevPasswords, savedPasswordData]);

        Alert.alert("Success", "Password saved successfully");
        navigation.goBack();
      } catch (error) {
        console.error("Error saving password:", error);
        Alert.alert("Error", "Failed to save password. Please try again.");
      }
    } else {
      Alert.alert("Validation Error", "Please fill in all fields");
    }
  };

  const saveToAsyncStorage = async (newPassword: PasswordData) => {
    try {
      const existingData = await AsyncStorage.getItem(SECURE_STORE_KEY);
      let passwords = existingData ? JSON.parse(existingData) : [];
      // console.log(existingData);
      passwords.push(newPassword);
      await AsyncStorage.setItem(SECURE_STORE_KEY, JSON.stringify(passwords));
    } catch (error) {
      console.error("Error saving to AsyncStorage:", error);
      throw error;
    }
  };

  const fetchPasswords = async () => {
    try {
      const ref = collection(Firebase_DB, `${mail}_passwords`);
      const firestorePasswords = [];
      if (isSyncEnabled) {
        const snapshot = await getDocs(query(ref));
        snapshot.forEach((doc) => {
          let ob = doc.data();
          firestorePasswords.push(ob);
        });
      }

      const asyncStoreData = await AsyncStorage.getItem(SECURE_STORE_KEY);
      const localPasswords = asyncStoreData ? JSON.parse(asyncStoreData) as PasswordData[] : [];

      const pendingPasswords = localPasswords.filter(p => p.pendingSync);
      if (isSyncEnabled)
        for (const password of pendingPasswords) {
          const { pendingSync, id, ...passwordData } = password;
          const docRef = await addDoc(ref, {
            ...passwordData,
            lastModified: Date.now()
          });
          password.id = docRef.id;
          password.pendingSync = false;
        }

      const mergedPasswords = mergePasswords(localPasswords, firestorePasswords);
      await AsyncStorage.setItem(SECURE_STORE_KEY, JSON.stringify(mergedPasswords));

      setPasswords(mergedPasswords);
    } catch (error) {
      console.error("Error fetching passwords:", error);
      Alert.alert("Error", "Failed to fetch passwords. Please try again.");
    }
  };

  const mergePasswords = (local: PasswordData[], cloud: PasswordData[]): PasswordData[] => {
    const merged = new Map<string, PasswordData>();

    // Add all local passwords to map
    local.forEach(password => {
      if (!password.pendingSync) {
        merged.set(password.id!, password);
      }
    });
    cloud.forEach(password => {
      const existing = merged.get(password.id!);
      if (!existing || (password.lastModified || 0) > (existing.lastModified || 0)) {
        merged.set(password.id!, password);
      }
    });

    // Add pending sync passwords
    local.filter(p => p.pendingSync).forEach(password => {
      merged.set(password.id!, password);
    });

    return Array.from(merged.values());
  };

  useEffect(() => {
    const fetchPasswordsAsync = async () => {
      await fetchPasswords();
    };

    fetchPasswordsAsync();
  }, [500]);

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
            onChangeText={handlePasswordChange}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.generateButton, { marginLeft: 10 }]}
            onPress={generateAndSetPassword}
          >
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.passwordStrength, { color: strength.strength === 'very weak' ? 'red' : strength.strength === 'weak' ? 'crimson' : strength.strength === 'medium' ? 'orange' : 'green' }]}>
          Password Strength: {strength.strength}
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
  // Styles remain the same
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
  },
  passwordStrength: {
    marginBottom: 10,
    fontSize: 14,
  }
});