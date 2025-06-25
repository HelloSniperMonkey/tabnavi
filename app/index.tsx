import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PasswordProvider, KeyProvider } from './components/PasswordContext';
import MainStack from './navigation/Biometric';
import { Firebase_Auth } from '../FirebaseConfig';
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { View, Text } from 'react-native';
import Login from './screens/Login';
import { AuthProvider } from './components/AuthContext';
import { SyncProvider } from './components/SyncContext';

const RootStack = createNativeStackNavigator();

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = Firebase_Auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyProvider>
      <PasswordProvider>
        <AuthProvider>
          <SyncProvider>
            <NavigationContainer independent={true}>
              <RootStack.Navigator initialRouteName='Login'>
                {user ? (
                  <RootStack.Screen name="PasswordList" component={MainStack} options={{ headerShown: false }} />
                ) : (
                  <RootStack.Screen name="Login" component={Login} options={{ headerShown: false }} />
                )}
              </RootStack.Navigator>
            </NavigationContainer>
          </SyncProvider>
        </AuthProvider>
      </PasswordProvider>
    </KeyProvider>
  );
}