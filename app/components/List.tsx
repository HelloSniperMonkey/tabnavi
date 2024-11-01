import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, StyleSheet, TouchableOpacity, Alert, Clipboard } from "react-native";
import { ListItem, Icon, Button } from '@rneui/themed';
import { usePassword, MasterPassword } from './PasswordContext';
import * as SecureStore from 'expo-secure-store';

import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import Hex from 'crypto-js/enc-hex';
import CryptoJS from 'crypto-js';

export default function List() {
  const { passwords, setPasswords } = usePassword();
  const [expandedItems, setExpandedItems] = useState({});
  const [hide, setHide] = useState({});

  const decrypt = (encryptedData = '', encryptionKey = '') => {
    const [ivHex, encryptedText] = encryptedData.split(':');

    const iv = Hex.parse(ivHex);

    // Decrypt the encrypted text
    const decrypted = AES.decrypt(encryptedText, Utf8.parse(encryptionKey), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(Utf8);
  };

  useEffect(() => {
    setExpandedItems({});
    setHide({});
  }, [passwords.length]);

  const toggleHide = (index) => {
    setHide((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleExpand = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Alert.alert("Copied", "Password copied to clipboard");
  };

  const SECURE_STORE_KEY = 'encrypted_passwords';

  const deleteItem = (index) => {
    Alert.alert(
      "Delete",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const newPasswords = passwords.filter((_, i) => i !== index);
              
              // Remove the password from SecureStore
              const secureStoreData = await SecureStore.getItemAsync(SECURE_STORE_KEY);
              if (secureStoreData) {
                const storedPasswords = JSON.parse(secureStoreData);
                const updatedPasswords = storedPasswords.filter((_, i) => i !== index);
                console.log(updatedPasswords);
                await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify(updatedPasswords));
              }
  
              setPasswords(newPasswords);
            } catch (error) {
              console.error("Error deleting password:", error);
              Alert.alert("Error", "Failed to delete password. Please try again.");
            }
          },
        },
      ]
    );
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Vault</Text>

      {passwords.length === 0 ? (
        <Text style={styles.emptyText}>Nothing to show here. Add something.</Text>
      ) : (
        <FlatList
          data={passwords}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View>
              <TouchableOpacity onPress={() => toggleExpand(index)}>
                <ListItem containerStyle={styles.listItem} bottomDivider>
                  <ListItem.Content>
                    <ListItem.Title style={styles.title}>
                      {item.website || item.name}
                    </ListItem.Title>
                    <ListItem.Subtitle style={styles.subtitle}>
                      {item.username || item.subtitle}
                    </ListItem.Subtitle>
                  </ListItem.Content>
                  <Icon
                    name={expandedItems[index] ? "expand-less" : "expand-more"}
                    type="material"
                    color="#6e6e6e"
                  />
                </ListItem>
              </TouchableOpacity>

              {expandedItems[index] && (
                <View style={styles.expandedContainer}>
                  <Text style={styles.passwordText}>
                    Password: {hide[index] ? decrypt(item.encryptedpassword, decrypt(item.encryptedEncryptionKey, MasterPassword)) : "******"}
                  </Text>
                  <TouchableOpacity
                    style={styles.visibility}
                    onPress={() => toggleHide(index)}
                  >
                    <Icon
                      name={hide[index] ? "visibility-off" : "visibility"}
                      type="material"
                      color="#6e6e6e"
                    />
                  </TouchableOpacity>
                  <Button
                    title="Copy"
                    buttonStyle={styles.copyButton}
                    onPress={() => copyToClipboard(item.password)}
                  />
                  <Button
                    title="Delete"
                    buttonStyle={styles.deleteButton}
                    onPress={() => deleteItem(index)}
                  />
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  listItem: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  expandedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#eaeaea",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  passwordText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  copyButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  visibility: {
    paddingHorizontal: 10,
  },
});