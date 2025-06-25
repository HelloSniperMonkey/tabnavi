import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { Platform } from 'react-native';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAmP99cf_txA7ghE9O7Q108-mlOVP2jH2Y",
  authDomain: "manager-7e817.firebaseapp.com",
  projectId: "manager-7e817",
  storageBucket: "manager-7e817.appspot.com",
  messagingSenderId: "255469065726",
  appId: "1:255469065726:web:f75b1d485296b6f19fdcaf",
  measurementId: "G-07TL8QXNRN"
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