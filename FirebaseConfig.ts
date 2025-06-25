import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { Platform } from 'react-native';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
export const Firebase_App = initializeApp(firebaseConfig);

// Initialize Auth with platform-specific persistence
let Firebase_Auth;
if (Platform.OS === 'web') {
  // For web, use the default getAuth which includes browser persistence
  Firebase_Auth = getAuth(Firebase_App);
} else {
  // For React Native, use AsyncStorage persistence
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  Firebase_Auth = initializeAuth(Firebase_App, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { Firebase_Auth };
export const Firebase_DB = getFirestore(Firebase_App);