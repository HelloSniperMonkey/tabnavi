import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, StyleSheet, TouchableOpacity, Alert, Clipboard } from "react-native";
import { ListItem, Icon } from '@rneui/themed';
import { usePassword, useKey } from './PasswordContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkDataBreaches } from './DataBreach';

import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import Hex from 'crypto-js/enc-hex';
import CryptoJS from 'crypto-js';

const BREACH_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const LAST_BREACH_CHECK_KEY = 'last_breach_check';

export default function List() {
  const {BREACH_RESULTS_KEY, MasterPassword, SECURE_STORE_KEY} = useKey();
  const { passwords, setPasswords, breachResults, updateBreachResults, loadData } = usePassword();
  const [expandedItems, setExpandedItems] = useState({});
  const [hide, setHide] = useState({});

  const getBreachStatus = (username: string) => {
    const result = breachResults.find(r => r.email === username);
    return result?.isBreached || false;
  };

  const decrypt = (encryptedData = '', encryptionKey = '') => {
    const [ivHex, encryptedText] = encryptedData.split(':');
    const iv = Hex.parse(ivHex);
  
    const decrypted = AES.decrypt(encryptedText, encryptionKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decryptedText = decrypted.toString(Utf8);
    return decryptedText;
  };

  const checkForBreaches = async () => {
    try {
      // Check if it's time to run breach check
      const lastCheck = await AsyncStorage.getItem(LAST_BREACH_CHECK_KEY);
      const lastCheckTime = lastCheck ? parseInt(lastCheck) : 0;
      const now = Date.now();

      if (now - lastCheckTime >= BREACH_CHECK_INTERVAL) {
        // Run breach check
        const results = await checkDataBreaches(passwords);
        updateBreachResults(results);

        // Save results and update last check time
        await AsyncStorage.setItem(BREACH_RESULTS_KEY, JSON.stringify(results));
        await AsyncStorage.setItem(LAST_BREACH_CHECK_KEY, now.toString());

        // Notify user of any breaches
        const newBreaches = results.filter(result => result.isBreached);
        if (newBreaches.length > 0) {
          Alert.alert(
            "Security Alert",
            `Data breach detected for ${newBreaches.length} account(s). Please consider updating your passwords.`,
            [{ text: "OK" }]
          );
        }
      } else {
        // Load previous results
        const savedResults = await AsyncStorage.getItem(BREACH_RESULTS_KEY);
        if (savedResults) {
          updateBreachResults(JSON.parse(savedResults));
        }
      }
    } catch (error) {
      console.error("Error checking for breaches:", error);
    }
  };

  const getSecurityStyles = (username: string) => {
    const isBreached = getBreachStatus(username);
    return {
      container: {
        ...styles.listItem,
        backgroundColor: isBreached ? styles.breachedItem.backgroundColor : styles.secureItem.backgroundColor,
        borderLeftWidth: 4,
        borderLeftColor: isBreached ? '#ff3b30' : '#34c759',
      },
      title: {
        ...styles.title,
        color: isBreached ? styles.breachedItem.color : styles.secureItem.color,
      },
      subtitle: {
        ...styles.subtitle,
        color: isBreached ? styles.breachedItem.subColor : styles.secureItem.subColor,
      },
    };
  };

  useEffect(() => {
    console.log(MasterPassword);
    setExpandedItems({});
    setHide({});
    checkForBreaches();
    const load = async () => {
      await loadData();
    }
    load();
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
              
              // Remove the password from AsyncStorage
              const storedData = await AsyncStorage.getItem(SECURE_STORE_KEY);
              if (storedData) {
                const storedPasswords = JSON.parse(storedData);
                const updatedPasswords = storedPasswords.filter((_, i) => i !== index);
                console.log(updatedPasswords);
                await AsyncStorage.setItem(SECURE_STORE_KEY, JSON.stringify(updatedPasswords));
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

  // Rest of the component remains the same
  return (
    <View style={styles.container}>
      {passwords.length === 0 ? (
        <Text style={styles.emptyText}>Nothing to show here. Add something.</Text>
      ) : (
        <FlatList
          data={passwords}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => {
            const securityStyles = getSecurityStyles(item.username);
            const isBreached = getBreachStatus(item.username);

            return (
              <View>
                <TouchableOpacity onPress={() => toggleExpand(index)}>
                  <ListItem containerStyle={securityStyles.container} bottomDivider>
                    <ListItem.Content>
                      <View style={styles.titleContainer}>
                        <ListItem.Title style={securityStyles.title}>
                          {item.website || item.name}
                        </ListItem.Title>
                        {isBreached && (
                          <Icon
                            name="warning"
                            type="material"
                            color="#ff3b30"
                            size={16}
                            style={styles.warningIcon}
                          />
                        )}
                      </View>
                      <ListItem.Subtitle style={securityStyles.subtitle}>
                        {item.username || item.subtitle}
                      </ListItem.Subtitle>
                      {isBreached && (
                        <Text style={styles.breachWarning}>
                          Data breach detected - Update recommended
                        </Text>
                      )}
                    </ListItem.Content>
                    <Icon
                      name={expandedItems[index] ? "expand-less" : "expand-more"}
                      type="material"
                      color={isBreached ? "#ff3b30" : "#34c759"}
                    />
                  </ListItem>
                </TouchableOpacity>

                {expandedItems[index] && (
                  <View style={[styles.expandedContainer, isBreached && styles.breachedExpandedContainer]}>
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
                    <TouchableOpacity
                      style={styles.visibility}
                      onPress={() => copyToClipboard(decrypt(item.encryptedpassword, decrypt(item.encryptedEncryptionKey, MasterPassword)))}
                    >
                      <Icon
                        name="content-copy"
                        type="material"
                        color="#6e6e6e"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.visibility}
                      onPress={() => deleteItem(index)}
                    >
                      <Icon
                        name="delete"
                        type="material"
                        color="#6e6e6e"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles remain unchanged
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  breachedItem: {
    backgroundColor: "#fff8f8",
    color: "#ff3b30",
    subColor: "#ff6961",
  },
  secureItem: {
    backgroundColor: "#f8fff8",
    color: "#34c759",
    subColor: "#666",
  },
  breachWarning: {
    color: "#ff3b30",
    fontSize: 12,
    marginTop: 4,
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
  breachedExpandedContainer: {
    backgroundColor: "#ffefef",
  },
  passwordText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  visibility: {
    paddingHorizontal: 10,
  },
  warningIcon: {
    marginLeft: 8,
  },
});