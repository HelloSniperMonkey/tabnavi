import React, { createContext, useContext, useEffect, useState } from 'react';
import { Firebase_Auth } from '../../FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { useKey } from './PasswordContext';

const AUTH_KEYS_STORE_KEY = 'auth_keys';

interface AuthKeys {
  secureStoreKey: string;
  breachResultsKey: string;
  masterPassword: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  initializeAuthKeys: (email: string) => Promise<void>;
  clearAuthKeys: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { 
    setMasterPassword, 
    setSECURE_STORE_KEY, 
    setBREACH_RESULTS_KEY,
    clearKeys 
  } = useKey();

  const initializeAuthKeys = async (email: string) => {
    const processedEmail = email.split('@')[0] + email.split('@')[1];
    const keys: AuthKeys = {
      secureStoreKey: processedEmail+"SS",
      breachResultsKey: processedEmail+"BR",
      masterPassword: processedEmail+"MP"
    };
    
    // Save keys to secure storage
    await SecureStore.setItemAsync(AUTH_KEYS_STORE_KEY, JSON.stringify(keys));
    
    // Update context values
    setSECURE_STORE_KEY(keys.secureStoreKey);
    setBREACH_RESULTS_KEY(keys.breachResultsKey);
    setMasterPassword(keys.masterPassword);
  };

  const clearAuthKeys = async () => {
    await SecureStore.deleteItemAsync(AUTH_KEYS_STORE_KEY);
    clearKeys();
  };

  useEffect(() => {
    const loadAuthKeys = async () => {
      try {
        const savedKeys = await SecureStore.getItemAsync(AUTH_KEYS_STORE_KEY);
        if (savedKeys) {
          const keys: AuthKeys = JSON.parse(savedKeys);
          setSECURE_STORE_KEY(keys.secureStoreKey);
          setBREACH_RESULTS_KEY(keys.breachResultsKey);
          setMasterPassword(keys.masterPassword);
        }
      } catch (error) {
        console.error('Error loading auth keys:', error);
        await clearAuthKeys();
      }
    };

    const unsubscribe = onAuthStateChanged(Firebase_Auth, async (user) => {
      if (user) {
        await loadAuthKeys();
        setIsAuthenticated(true);
      } else {
        await clearAuthKeys();
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isLoading, 
        initializeAuthKeys,
        clearAuthKeys
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};