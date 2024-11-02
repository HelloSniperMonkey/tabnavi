import { View, Text, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import React, { useState } from 'react';
import { Firebase_Auth } from '../../FirebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useKey, usePassword } from '../components/PasswordContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const auth = Firebase_Auth;
    const {loadData} = usePassword();
    const {MasterPassword, setMasterPassword, SECURE_STORE_KEY, setSECURE_STORE_KEY, BREACH_RESULTS_KEY, setBREACH_RESULTS_KEY} = useKey();
    const s="internal-storage-encrypted-passwords", b="breach-results-stored-in-my-app",m="hellomyappisgood";

    const signIn = async () => {
        setLoading(true);
        setError('');
        const e = email.split('@')[0] + email.split('@')[1];
        
        try {
            // First attempt to sign in
            const response = await signInWithEmailAndPassword(auth, email, password);
            
            // If successful, update keys and load new data
            setSECURE_STORE_KEY(e + s);
            setBREACH_RESULTS_KEY(e + b);
            setMasterPassword(e + m);
            
            
            // Force reload data with new keys
            await loadData();
            
            console.log(response);
        } catch (error: any) {
            setError(error.message);
            console.log("error:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async () => {
        setLoading(true);
        setError('');
        const e = email.split('@')[0]+email.split('@')[1];

        setSECURE_STORE_KEY(e+s);
        setBREACH_RESULTS_KEY(e+b);
        setMasterPassword(e+m);
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            console.log(response);
        } catch (error: any) {
            setError(error.message);
            console.log("error:", error.message);
        } finally {
            setLoading(false);
        }
    }

    const reset = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await sendPasswordResetEmail(auth, email);
            setError('Password reset email sent!');
        } catch (error: any) {
            setError(error.message);
            console.log("Error:", error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formContainer}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.headerText}>Welcome Back</Text>
                    <Text style={styles.subHeaderText}>Sign in to continue</Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        value={email}
                        style={styles.input}
                        placeholder='Email'
                        placeholderTextColor="#666"
                        autoCapitalize='none'
                        keyboardType="email-address"
                        onChangeText={setEmail}
                    />
                    <TextInput
                        secureTextEntry={true}
                        value={password}
                        style={styles.input}
                        placeholder='Password'
                        placeholderTextColor="#666"
                        autoCapitalize='none'
                        onChangeText={setPassword}
                    />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.buttonContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#007AFF" />
                    ) : (
                        <>
                            <TouchableOpacity 
                                style={styles.primaryButton} 
                                onPress={signIn}
                            >
                                <Text style={styles.primaryButtonText}>Sign In</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.secondaryButton}
                                onPress={signUp}
                            >
                                <Text style={styles.secondaryButtonText}>Create Account</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.textButton}
                                onPress={reset}
                            >
                                <Text style={styles.textButtonText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    headerContainer: {
        marginBottom: 32,
    },
    headerText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    subHeaderText: {
        fontSize: 16,
        color: '#666',
    },
    inputContainer: {
        marginBottom: 24,
    },
    input: {
        height: 50,
        borderRadius: 12,
        borderColor: '#ddd',
        borderWidth: 1,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16,
        color: '#000',
        backgroundColor: '#fff',
    },
    buttonContainer: {
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#F5F5F5',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    textButton: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    textButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
});