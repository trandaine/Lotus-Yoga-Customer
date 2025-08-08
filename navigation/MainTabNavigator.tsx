import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import BillScreen from '../screens/BillScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MyCourseScreen from '../screens/MyCourseScreen';
import TeachersScreen from '../screens/TeachersScreen';
import UserPageScreen from '../screens/UserPageScreen';

type MainTabParamList = {
  Dashboard: undefined;
  Course: undefined;
  Teachers: undefined;
  User: undefined;
  Bills: undefined;
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Course') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Teachers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'User') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Bills') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ 
          title: 'Home',
          tabBarTestID: 'home-tab',
        }}
      />
      <Tab.Screen 
        name="Course" 
        component={MyCourseScreen} 
        options={{ 
          title: 'Courses',
          tabBarTestID: 'courses-tab',
        }}
      />
      <Tab.Screen
        name="Teachers"
        component={TeachersScreen}
        options={{
          title: 'Teachers',
          tabBarTestID: 'teachers-tab',
        }}
      />
      <Tab.Screen 
        name="Bills" 
        component={BillScreen} 
        options={{ 
          title: 'Bills',
          tabBarTestID: 'bills-tab',
        }}
      />
      <Tab.Screen 
        name="User" 
        component={UserPageScreen} 
        options={{ 
          title: 'Profile',
          tabBarTestID: 'profile-tab',
        }}
      />
    </Tab.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>(); 