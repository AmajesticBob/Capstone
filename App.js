import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './ThemeContext';
import { colors, getThemedColors } from './theme';

import ClosetScreen from './screens/ClosetScreen';
import PlannerScreen from './screens/PlannerScreen';
import TryOnScreen from './screens/TryOnScreen';
import InspirationScreen from './screens/InspirationScreen';
import ProfileScreen from './screens/ProfileScreen';
import AddItemScreen from './screens/AddItemScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ClosetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClosetMain" component={ClosetScreen} />
      <Stack.Screen 
        name="AddItem" 
        component={AddItemScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  const { isDark } = useTheme();
  const themedColors = getThemedColors(isDark);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: themedColors.card,
          borderTopColor: themedColors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: themedColors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Closet"
        component={ClosetStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="hanger" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Planner"
        component={PlannerScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="grid-view" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Try-On"
        component={TryOnScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="human" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inspiration"
        component={InspirationScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="lightbulb-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
