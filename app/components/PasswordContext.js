import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from 'expo-secure-store';

// Create the Key Context
const KeyContext = createContext();

export const KeyProvider = ({children}) => {
    const [MasterPassword, setMasterPassword] = useState('hellomyappisgood');
    const [SECURE_STORE_KEY, setSECURE_STORE_KEY] = useState('internal-storage-encrypted-passwords');
    const [BREACH_RESULTS_KEY, setBREACH_RESULTS_KEY] = useState('breach-results-stored-in-my-app');

    // Add clearKeys function
    const clearKeys = () => {
        setMasterPassword('hellomyappisgood');
        setSECURE_STORE_KEY('internal-storage-encrypted-passwords');
        setBREACH_RESULTS_KEY('breach-results-stored-in-my-app');
    };

    return (
        <KeyContext.Provider 
            value={{ 
                MasterPassword, 
                setMasterPassword,
                SECURE_STORE_KEY, 
                setSECURE_STORE_KEY,
                BREACH_RESULTS_KEY, 
                setBREACH_RESULTS_KEY,
                clearKeys
            }}
        >
            {children}
        </KeyContext.Provider>
    );
};

export const useKey = () => {
    const context = useContext(KeyContext);
    if (!context) {
        throw new Error("useKey must be used within a KeyProvider");
    }
    return context;
};

// Create the Password Context
const PasswordContext = createContext();

export const PasswordProvider = ({ children }) => {
    const [passwords, setPasswords] = useState([]);
    const [breachResults, setBreachResults] = useState([]);
    const { SECURE_STORE_KEY, BREACH_RESULTS_KEY } = useKey();

    useEffect(() => {
        loadData();
    }, [SECURE_STORE_KEY, BREACH_RESULTS_KEY]); // Add dependency on keys

    const loadData = async () => {
        try {
            // Load passwords
            const secureStoreData = await SecureStore.getItemAsync(SECURE_STORE_KEY);
            const secureStorePasswords = secureStoreData ? JSON.parse(secureStoreData) : [];
            setPasswords(secureStorePasswords);
            console.log(secureStoreData);
            console.log(secureStorePasswords);
            // Load breach results
            const savedBreachResults = await SecureStore.getItemAsync(BREACH_RESULTS_KEY);
            if (savedBreachResults) {
                setBreachResults(JSON.parse(savedBreachResults));
            } else {
                setBreachResults([]); // Reset if no data found
            }
        } catch (error) {
            console.error("Error loading data:", error);
            // Reset states on error
            setPasswords([]);
            setBreachResults([]);
        }
    };

    const clearPasswords = async () => {
        try {
            // await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
            // await SecureStore.deleteItemAsync(BREACH_RESULTS_KEY);
            setPasswords([]);
            setBreachResults([]);
        } catch (error) {
            console.error("Error clearing passwords:", error);
        }
    };

    const updateBreachResults = async (newResults) => {
        try {
            await SecureStore.setItemAsync(BREACH_RESULTS_KEY, JSON.stringify(newResults));
            setBreachResults(newResults);
        } catch (error) {
            console.error("Error saving breach results:", error);
        }
    };

    return (
        <PasswordContext.Provider 
            value={{ 
                passwords, 
                setPasswords, 
                breachResults, 
                updateBreachResults,
                clearPasswords,
                loadData
            }}
        >
            {children}
        </PasswordContext.Provider>
    );
};

export const usePassword = () => {
    const context = useContext(PasswordContext);
    if (!context) {
        throw new Error("usePassword must be used within a PasswordProvider");
    }
    return context;
};