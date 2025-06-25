import { Firebase_DB } from "../../FirebaseConfig";
import { collection, addDoc, getDocs, query, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PasswordData {
  id?: string;
  userId: string;
  website: string;
  username: string;
  encryptedpassword: string;
  encryptedEncryptionKey: string;
  pendingSync?: boolean;
  lastModified?: number;
  tag?: string;
}

export class SyncManager {
  private mail: string;
  private secureStoreKey: string;

  constructor(mail: string, secureStoreKey: string) {
    this.mail = mail;
    this.secureStoreKey = secureStoreKey;
  }

  async syncPasswords(): Promise<void> {
    try {
      // Get local passwords
      const localPasswords = await this.getLocalPasswords();
      
      // Get cloud passwords
      const cloudPasswords = await this.getCloudPasswords();
      
      // Merge passwords (cloud wins for conflicts, local for pending sync)
      const mergedPasswords = this.mergePasswords(localPasswords, cloudPasswords);
      
      // Upload pending sync passwords to cloud
      await this.uploadPendingPasswords(mergedPasswords);
      
      // Save merged passwords locally
      await this.saveLocalPasswords(mergedPasswords);
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  async getLocalPasswords(): Promise<PasswordData[]> {
    try {
      const asyncStoreData = await AsyncStorage.getItem(this.secureStoreKey);
      return asyncStoreData ? JSON.parse(asyncStoreData) : [];
    } catch (error) {
      console.error('Error loading local passwords:', error);
      return [];
    }
  }

  private async getCloudPasswords(): Promise<PasswordData[]> {
    try {
      const ref = collection(Firebase_DB, `${this.mail}_passwords`);
      const snapshot = await getDocs(query(ref));
      return snapshot.docs.map(doc => ({
        ...doc.data() as PasswordData,
        id: doc.id
      }));
    } catch (error) {
      console.error('Error loading cloud passwords:', error);
      return [];
    }
  }

  private async uploadPendingPasswords(passwords: PasswordData[]): Promise<PasswordData[]> {
    const ref = collection(Firebase_DB, `${this.mail}_passwords`);
    const updatedPasswords = [...passwords];

    for (let i = 0; i < updatedPasswords.length; i++) {
      const password = updatedPasswords[i];
      if (password.pendingSync) {
        try {
          const { pendingSync, id, ...passwordData } = password;
          const docRef = await addDoc(ref, {
            ...passwordData,
            lastModified: Date.now()
          });
          
          // Update the password with new ID and remove pending flag
          updatedPasswords[i] = {
            ...password,
            id: docRef.id,
            pendingSync: false,
            lastModified: Date.now()
          };
        } catch (error) {
          console.error('Error uploading password:', error);
          // Keep pending flag if upload failed
        }
      }
    }

    return updatedPasswords;
  }

  private mergePasswords(local: PasswordData[], cloud: PasswordData[]): PasswordData[] {
    const merged = new Map<string, PasswordData>();

    // Add all cloud passwords to the map
    cloud.forEach(cloudPassword => {
      if (cloudPassword.id) {
        merged.set(cloudPassword.id, {
          ...cloudPassword,
          lastModified: cloudPassword.lastModified || Date.now()
        });
      }
    });

    // Process local passwords
    local.forEach(localPassword => {
      if (localPassword.pendingSync) {
        // Always keep pending sync passwords from local
        const tempId = localPassword.id || `temp_${Date.now()}_${Math.random()}`;
        merged.set(tempId, localPassword);
      } else if (localPassword.id) {
        const existingPassword = merged.get(localPassword.id);

        // If password exists in both local and cloud, use the newer version
        if (existingPassword) {
          const localModified = localPassword.lastModified || 0;
          const cloudModified = existingPassword.lastModified || 0;

          if (localModified > cloudModified) {
            merged.set(localPassword.id, {
              ...localPassword,
              lastModified: localModified
            });
          }
        } else {
          // If password only exists locally, add it
          merged.set(localPassword.id, {
            ...localPassword,
            lastModified: localPassword.lastModified || Date.now()
          });
        }
      }
    });

    // Convert map to array and sort by lastModified (newest first)
    return Array.from(merged.values())
      .sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
  }

  private async saveLocalPasswords(passwords: PasswordData[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.secureStoreKey, JSON.stringify(passwords));
    } catch (error) {
      console.error('Error saving local passwords:', error);
      throw error;
    }
  }
}
