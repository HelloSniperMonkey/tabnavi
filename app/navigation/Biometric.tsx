import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import NewPassword from '../screens/NewPassword';
import * as LocalAuthentication from 'expo-local-authentication';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

export default function MainStack() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your passwords',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      console.log("Authentication result:", result);

      if (result.success) {
        setAuthenticated(true);
        setAuthChecking(false);
      } else if (!result.error?.includes('canceled')) {
        authenticate();
      } else {
        setAuthError('Authentication canceled');
        setAuthChecking(false);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError('Authentication failed');
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const hasBiometrics = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !hasBiometrics) {
          setAuthenticated(true);
          setAuthChecking(false);
          return;
        }

        authenticate();
      } catch (error) {
        console.error("Setup error:", error);
        setAuthError('Setup failed');
        setAuthChecking(false);
      }
    };

    setupAuth();
  }, []);

  if (authChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Authenticating...</Text>
      </View>
    );
  }

  if (authError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>{authError}</Text>
      </View>
    );
  }

  if (!authenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Authentication required</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TabNavigator"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewPassword"
        component={NewPassword}
        options={{
          headerShown: false ,
          presentation: 'modal',
          title: 'Add Password'
        }}
      />
    </Stack.Navigator>
  );
}