// PasswordContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from 'expo-secure-store';

export const MasterPassword = "hellomyappisgood";
// Create the Password Context
const PasswordContext = createContext();

export const PasswordProvider = ({ children }) => {
    // Initialize passwords state
    const [passwords, setPasswords] = useState();

    const SECURE_STORE_KEY = 'encrypted_passwords';

    useEffect(() => {
        async function getData() {
            const secureStoreData = await SecureStore.getItemAsync(SECURE_STORE_KEY);
            const secureStorePasswords = secureStoreData ? JSON.parse(secureStoreData) : [];

            setPasswords(secureStorePasswords);
        }
        getData();
    }, [500]);

    return (
        <PasswordContext.Provider value={{ passwords, setPasswords }}>
            {children}
        </PasswordContext.Provider>
    );
};

// Custom hook to use PasswordContext
export const usePassword = () => {
    const context = useContext(PasswordContext);
    if (!context) {
        throw new Error("usePassword must be used within a PasswordProvider");
    }
    return context;
};
