import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Index from './index';

const Stack = createNativeStackNavigator();

export default function Layout() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Home" component={Index} />
    </Stack.Navigator>
  );
}
