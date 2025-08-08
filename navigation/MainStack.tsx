import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import MainTabNavigator from './MainTabNavigator';
import PaymentScreen from '../screens/PaymentScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

type MainStackParamList = {
  MainTabs: undefined;
  Payment: {
    course: {
      id: number;
      title: string;
      instructor: string;
      duration: string;
      level: string;
      price: string;
      description: string;
      imageUrl?: string;
      room?: string;
      category?: string;
    };
  };
  EditProfile: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
      />
    </Stack.Navigator>
  );
}
