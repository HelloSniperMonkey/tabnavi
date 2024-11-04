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
    headerStyle:{},
    headerTitleAlign: 'center',
    headerTitleStyle:{
      fontSize:45,
      justifycontent : 'center',
      alignItems: 'center'
    },
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