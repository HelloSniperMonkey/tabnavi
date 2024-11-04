import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, StyleSheet, TouchableOpacity, Alert, Clipboard, Modal, RefreshControl } from "react-native";
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

export default function List({ filter, filterText }) {
  const { BREACH_RESULTS_KEY, MasterPassword, SECURE_STORE_KEY } = useKey();
  const { passwords, setPasswords, breachResults, updateBreachResults, loadData } = usePassword();
  const [expandedItems, setExpandedItems] = useState({});
  const [hide, setHide] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

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

  const [shouldReload, setShouldReload] = useState(0);

  useEffect(() => {
    console.log(MasterPassword);
    setExpandedItems({});
    setHide({});
    checkForBreaches();
    const load = async () => {
      await loadData();
    }
    load();
  }, [shouldReload]);

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
              setShouldReload(prev => prev + 1);
            } catch (error) {
              console.error("Error deleting password:", error);
              Alert.alert("Error", "Failed to delete password. Please try again.");
            }
          },
        },
      ]
    );
  };

  const TagSelectionModal = ({ visible, onClose, onSelectTag, index }) => {
    const tags = [
      { id: 'work', label: 'Work', icon: 'work' },
      { id: 'banking', label: 'Banking', icon: 'account-balance' },
      { id: 'social', label: 'Social', icon: 'people' }
    ];

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={styles.tagOption}
                onPress={() => {
                  onSelectTag(index, tag.id);
                  onClose();
                }}
              >
                <Icon name={tag.icon} type="material" color="#007AFF" />
                <Text style={styles.tagText}>{tag.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const choseTag = (index) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  const handleTagSelection = async (index, tag) => {
    passwords[index]["tag"] = tag;
    try {

      const storedData = await AsyncStorage.getItem(SECURE_STORE_KEY);
      if (storedData) {
        const storedPasswords = JSON.parse(storedData);
        console.log(passwords);
        await AsyncStorage.setItem(SECURE_STORE_KEY, JSON.stringify(passwords));
      }

      console.log(`Setting tag ${tag} for item at index ${index}`);
      setPasswords(passwords);
      setShouldReload(prev => prev + 1);
    } catch (error) {
      console.error("Error setting tag for password:", error);
      Alert.alert("Error", "Failed to give tag to password. Please try again.");
    }
  };

  const filteredPasswords = passwords.filter(item => {
    if (!filter && !filterText) return true; // If no filter, show all items
    else if (!filterText) {
      const searchLower = filter.toLowerCase();
      return (
        (item.tag && item.tag.toLowerCase().includes(searchLower))
      );
    }
    else {
      const searchLower = filterText.toLowerCase();
      return (
        (item.website && item.website.toLowerCase().includes(searchLower)) ||
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.username && item.username.toLowerCase().includes(searchLower)) ||
        (item.tag && item.tag.toLowerCase().includes(searchLower))
      );
    }
  });
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
      await checkForBreaches();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);
  // Rest of the component remains the same
  return (
    <View style={styles.container}>
      <TagSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectTag={handleTagSelection}
        index={selectedIndex}
      />

      {filteredPasswords.length === 0 ? (
        <Text style={styles.emptyText}>
          {filter ? "No matches found for your search." : "Nothing to show here. Add something."}
        </Text>
      ) : (
        <FlatList
          data={filteredPasswords}
          keyExtractor={(item, index) => index.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          renderItem={({ item, index }) => {
            const securityStyles = getSecurityStyles(item.username);
            const isBreached = getBreachStatus(item.username);

            return (
              <View>
                <TouchableOpacity
                  onPress={() => toggleExpand(index)}
                  onLongPress={() => choseTag(index)}
                >
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
                        {item.tag && (
                          <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>{item.tag}</Text>
                          </View>
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
  container: {
    paddingTop: 5,
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
  modalOverlay: {
    flex: 1,
    animation: 'fade',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tagText: {
    fontSize: 16,
    marginLeft: 0,
  },
  tagBadge: {
    backgroundColor: '#e8e8e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  tagBadgeText: {
    fontSize: 12,
    color: '#666',
  }
});