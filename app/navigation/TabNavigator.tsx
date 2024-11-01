import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import PasswordList from '../screens/PasswordList';
import Settings from '../screens/Settings';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (

<Tab.Navigator
  screenOptions={{
    headerLargeTitle: false, // Disable large titles
    headerTitleAlign: 'center', // Center-align the title
    tabBarActiveTintColor: '#007AFF',
    tabBarInactiveTintColor: '#8E8E93',
    tabBarStyle: { paddingBottom: 6, height: 60 },
    headerStyle: {
      backgroundColor: '#f8f8f8',
      height: 80, // Adjust this value to reduce the header height
    },
    headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
  }}
>
  <Tab.Screen
    name="Passwords"
    component={PasswordList}
    options={{
      tabBarIcon: ({ color, size }) => (
        <FontAwesome name="lock" size={size} color={color} />
      ),
    }}
  />
  <Tab.Screen
    name="Settings"
    component={Settings}
    options={{
      tabBarIcon: ({ color, size }) => (
        <FontAwesome name="gear" size={size} color={color} />
      ),
    }}
  />
</Tab.Navigator>

  );
}