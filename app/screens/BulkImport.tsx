import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { Icon } from '@rneui/themed';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { usePassword, useKey } from '../components/PasswordContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import Hex from 'crypto-js/enc-hex';
import WordArray from 'crypto-js/lib-typedarrays';
import CryptoJS from 'crypto-js';
import { Firebase_Auth, Firebase_DB } from "../../FirebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import NetInfo from "@react-native-community/netinfo";

interface ParsedPassword {
  website: string;
  password: string;
  originalLine: string;
  lineNumber: number;
}

export default function BulkImport() {
  const navigation = useNavigation();
  const { SECURE_STORE_KEY, MasterPassword, mail } = useKey();
  const { passwords, setPasswords } = usePassword();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [previewData, setPreviewData] = useState<ParsedPassword[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState('');

  const encrypt = (data: string, encryptionKey: string): string => {
    const initializationVector = WordArray.random(16);

    const encrypted = AES.encrypt(data, encryptionKey, {
      iv: initializationVector,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return `${initializationVector.toString(Hex)}:${encrypted.toString()}`;
  };

  const parsePasswordFile = (content: string): ParsedPassword[] => {
    const lines = content.split('\n');
    const parsed: ParsedPassword[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return; // Skip empty lines and comments

      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex === -1) {
        errors.push(`Line ${index + 1}: Invalid format (missing colon)`);
        return;
      }

      const website = trimmedLine.substring(0, colonIndex).trim();
      const password = trimmedLine.substring(colonIndex + 1).trim();

      if (!website || !password) {
        errors.push(`Line ${index + 1}: Empty website or password`);
        return;
      }

      parsed.push({
        website,
        password,
        originalLine: trimmedLine,
        lineNumber: index + 1,
      });
    });

    if (errors.length > 0) {
      Alert.alert(
        'Parsing Errors',
        `Found ${errors.length} errors:\n\n${errors.slice(0, 5).join('\n')}${
          errors.length > 5 ? '\n\n...and more' : ''
        }`,
        [{ text: 'Continue Anyway' }, { text: 'Cancel', style: 'cancel' }]
      );
    }

    return parsed;
  };

  const selectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      // Check file size (limit to 1MB for performance)
      const fileSize = result.assets[0].size || 0;
      if (fileSize > 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file smaller than 1MB');
        return;
      }

      setSelectedFile(result);
      
      // Read file content
      const response = await fetch(result.assets[0].uri);
      const content = await response.text();
      
      // Check content length
      if (content.length > 100000) {
        Alert.alert('File Too Large', 'File content is too large. Please reduce the number of passwords or split into multiple files.');
        return;
      }
      
      const parsedData = parsePasswordFile(content);
      setPreviewData(parsedData);
      setShowPreview(true);
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert('Error', 'Failed to select or read file');
    }
  };

  const processTextInput = () => {
    if (!textInput.trim()) {
      Alert.alert('Error', 'Please enter some password data');
      return;
    }

    // Check content length
    if (textInput.length > 100000) {
      Alert.alert('Input Too Large', 'Input content is too large. Please reduce the number of passwords.');
      return;
    }

    const parsedData = parsePasswordFile(textInput);
    setPreviewData(parsedData);
    setShowPreview(true);
  };

  const importPasswords = async () => {
    if (previewData.length === 0) {
      Alert.alert('Error', 'No valid passwords to import');
      return;
    }

    setIsLoading(true);

    try {
      const currentUser = Firebase_Auth.currentUser;
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected;

      let successCount = 0;
      let failureCount = 0;
      const newPasswords = [...passwords];

      for (const item of previewData) {
        try {
          const passwordId = uuid.v4() as string;
          const encryptedPassword = encrypt(item.password, MasterPassword);
          const encryptedKey = encrypt(MasterPassword, MasterPassword);

          const passwordData = {
            id: passwordId,
            userId: currentUser?.uid || 'offline',
            website: item.website,
            username: item.website, // Using website as username since no username is provided
            encryptedpassword: encryptedPassword,
            encryptedEncryptionKey: encryptedKey,
            category: 'all', // Default category
            createdAt: new Date().toISOString(),
          };

          // Save to local storage
          newPasswords.push(passwordData);

          // Save to Firebase if online and user is authenticated
          if (isOnline && currentUser) {
            try {
              await addDoc(collection(Firebase_DB, 'passwords'), passwordData);
            } catch (firebaseError) {
              console.warn('Failed to sync to Firebase:', firebaseError);
            }
          }

          successCount++;
        } catch (error) {
          console.error(`Failed to import password for ${item.website}:`, error);
          failureCount++;
        }
      }

      // Update passwords in context and storage
      setPasswords(newPasswords);
      await AsyncStorage.setItem(SECURE_STORE_KEY, JSON.stringify(newPasswords));

      Alert.alert(
        'Import Complete',
        `Successfully imported: ${successCount}\nFailed: ${failureCount}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import passwords');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreviewItem = (item: ParsedPassword, index: number) => (
    <View key={index} style={styles.previewItem}>
      <View style={styles.previewItemHeader}>
        <Icon name="web" size={20} color="#007AFF" />
        <Text style={styles.previewWebsite}>{item.website}</Text>
      </View>
      <Text style={styles.previewPassword}>Password: {item.password.replace(/./g, '•')}</Text>
      <Text style={styles.previewLine}>Line {item.lineNumber}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bulk Import</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Import Format</Text>
          <Text style={styles.instructionsText}>
            Upload a text file or paste content with passwords in this format:
          </Text>
          <View style={styles.exampleContainer}>
            <Text style={styles.exampleText}>
              {`facebook : mypassword123
google : anothersecretpass
github : supersecurekey
# This is a comment (ignored)
twitter : twitterpass`}
            </Text>
          </View>
          <Text style={styles.noteText}>
            • Each line should contain: website : password{'\n'}
            • Lines starting with # are ignored{'\n'}
            • Empty lines are ignored{'\n'}
            • Passwords will be encrypted and stored securely
          </Text>
        </View>

        {!showPreview ? (
          <View>
            {/* Input Mode Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  inputMode === 'file' && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setInputMode('file');
                  setTextInput('');
                }}
              >
                <Icon 
                  name="file-upload" 
                  size={20} 
                  color={inputMode === 'file' ? 'white' : '#007AFF'} 
                />
                <Text style={[
                  styles.toggleButtonText,
                  inputMode === 'file' && styles.toggleButtonTextActive,
                ]}>
                  Upload File
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  inputMode === 'text' && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setInputMode('text');
                  setSelectedFile(null);
                }}
              >
                <Icon 
                  name="edit" 
                  size={20} 
                  color={inputMode === 'text' ? 'white' : '#007AFF'} 
                />
                <Text style={[
                  styles.toggleButtonText,
                  inputMode === 'text' && styles.toggleButtonTextActive,
                ]}>
                  Paste Text
                </Text>
              </TouchableOpacity>
            </View>

            {inputMode === 'file' ? (
              <TouchableOpacity style={styles.selectButton} onPress={selectFile}>
                <Icon name="file-upload" size={24} color="white" style={styles.buttonIcon} />
                <Text style={styles.selectButtonText}>Select Text File</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.textInputContainer}>
                <Text style={styles.textInputLabel}>Paste your password data:</Text>
                <TextInput
                  style={styles.textInput}
                  multiline
                  placeholder="Paste your password data here...&#10;&#10;Example:&#10;facebook : mypassword123&#10;google : anothersecretpass"
                  value={textInput}
                  onChangeText={setTextInput}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[
                    styles.processButton,
                    !textInput.trim() && styles.processButtonDisabled,
                  ]}
                  onPress={processTextInput}
                  disabled={!textInput.trim()}
                >
                  <Icon name="preview" size={24} color="white" style={styles.buttonIcon} />
                  <Text style={styles.processButtonText}>Process Text</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                Preview ({previewData.length} passwords found)
              </Text>
              <TouchableOpacity onPress={() => {
                setShowPreview(false);
                setSelectedFile(null);
                setTextInput('');
              }}>
                <Text style={styles.changeFileText}>Change Input</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.previewList} nestedScrollEnabled>
              {previewData.map(renderPreviewItem)}
            </ScrollView>

            <TouchableOpacity
              style={[styles.importButton, isLoading && styles.importButtonDisabled]}
              onPress={importPasswords}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Icon name="save" size={24} color="white" style={styles.buttonIcon} />
                  <Text style={styles.importButtonText}>Import All Passwords</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  exampleContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginBottom: 12,
  },
  exampleText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#333',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  changeFileText: {
    color: '#007AFF',
    fontSize: 16,
  },
  previewList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  previewItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  previewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewWebsite: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  previewPassword: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  previewLine: {
    fontSize: 12,
    color: '#999',
  },
  importButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  importButtonDisabled: {
    backgroundColor: '#ccc',
  },
  importButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  textInputContainer: {
    marginTop: 8,
  },
  textInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 150,
    maxHeight: 300,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  processButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  processButtonDisabled: {
    backgroundColor: '#ccc',
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
