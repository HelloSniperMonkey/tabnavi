import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import { SyncManager } from './SyncManager';

const SYNC_SETTINGS_KEY = 'sync_settings';

interface SyncContextType {
  isSyncEnabled: boolean;
  setSyncEnabled: (enabled: boolean) => void;
  syncPasswords: (mail: string, secureStoreKey: string) => Promise<void>;
  isOnline: boolean;
  lastSyncTime: Date | null;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load sync settings on mount
  useEffect(() => {
    loadSyncSettings();
    
    // Set up network listener
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-sync when enabled and online
  useEffect(() => {
    // We can't auto-sync here because we need mail and secureStoreKey
    // Auto-sync will be handled by components that have access to these values
  }, [isSyncEnabled, isOnline]);

  const loadSyncSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SYNC_SETTINGS_KEY);
      if (savedSettings) {
        const { enabled, lastSync } = JSON.parse(savedSettings);
        setIsSyncEnabled(enabled);
        setLastSyncTime(lastSync ? new Date(lastSync) : null);
      }
    } catch (error) {
      console.error('Error loading sync settings:', error);
    }
  };

  const setSyncEnabled = async (enabled: boolean) => {
    try {
      setIsSyncEnabled(enabled);
      const settings = {
        enabled,
        lastSync: lastSyncTime?.toISOString() || null
      };
      await AsyncStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));

      if (enabled && isOnline) {
        // Note: syncPasswords will be called by the component with mail and secureStoreKey
      }
    } catch (error) {
      console.error('Error saving sync settings:', error);
      Alert.alert('Error', 'Failed to save sync settings');
    }
  };

  const syncPasswords = async (mail: string, secureStoreKey: string) => {
    if (!isSyncEnabled || !isOnline) {
      return;
    }

    try {
      const syncManager = new SyncManager(mail, secureStoreKey);
      await syncManager.syncPasswords();
      
      const currentTime = new Date();
      setLastSyncTime(currentTime);
      
      // Save last sync time
      const settings = {
        enabled: isSyncEnabled,
        lastSync: currentTime.toISOString()
      };
      await AsyncStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));

      console.log('Password sync completed successfully');
    } catch (error) {
      console.error('Error during sync:', error);
      throw error; // Re-throw so caller can handle the error
    }
  };

  return (
    <SyncContext.Provider 
      value={{ 
        isSyncEnabled, 
        setSyncEnabled, 
        syncPasswords,
        isOnline,
        lastSyncTime
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
