import { useSync } from './SyncContext';
import { useKey, usePassword } from './PasswordContext';
import { SyncManager } from './SyncManager';

export const useSyncWithContext = () => {
  const { isSyncEnabled, setSyncEnabled, isOnline, lastSyncTime } = useSync();
  const { mail, SECURE_STORE_KEY } = useKey();
  const { setPasswords } = usePassword();

  const syncPasswords = async () => {
    if (!isSyncEnabled || !isOnline || !mail || !SECURE_STORE_KEY) {
      return;
    }

    try {
      const syncManager = new SyncManager(mail, SECURE_STORE_KEY);
      await syncManager.syncPasswords();
      
      // Reload passwords after sync
      const updatedPasswords = await syncManager.getLocalPasswords();
      setPasswords(updatedPasswords);
      
      console.log('Password sync with context completed successfully');
    } catch (error) {
      console.error('Error during sync with context:', error);
      throw error;
    }
  };

  return {
    isSyncEnabled,
    setSyncEnabled,
    isOnline,
    lastSyncTime,
    syncPasswords
  };
};
