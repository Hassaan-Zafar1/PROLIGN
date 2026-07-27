import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import { useAuth } from '../context/AuthContext';

import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MentorProfileScreen from '../screens/MentorProfileScreen';
import BookingScreen from '../screens/BookingScreen';
import MenteeDashboard from '../screens/mentee/MenteeDashboard';
import DiscoveryScreen from '../screens/mentee/DiscoveryScreen';
import SessionsScreen from '../screens/mentee/SessionsScreen';
import MentorDashboard from '../screens/mentor/MentorDashboard';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminVerification from '../screens/admin/AdminVerification';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, primary: colors.primary },
};

function tabIcon(name) {
  return ({ color, size }) => <MaterialIcons name={name} size={size} color={color} />;
}

const screenOpts = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.onSurfaceVariant,
  tabBarStyle: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopColor: colors.outlineVariant,
    height: 62, paddingBottom: 8, paddingTop: 8,
  },
  tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
};

function MenteeTabs() {
  return (
    <Tab.Navigator screenOptions={screenOpts}>
      <Tab.Screen name="Home" component={MenteeDashboard} options={{ tabBarIcon: tabIcon('dashboard') }} />
      <Tab.Screen name="Find Mentors" component={DiscoveryScreen} options={{ tabBarIcon: tabIcon('explore') }} />
      <Tab.Screen name="Sessions" component={SessionsScreen} options={{ tabBarIcon: tabIcon('event-available') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('person') }} />
    </Tab.Navigator>
  );
}

function MentorTabs() {
  return (
    <Tab.Navigator screenOptions={screenOpts}>
      <Tab.Screen name="Home" component={MentorDashboard} options={{ tabBarIcon: tabIcon('dashboard') }} />
      <Tab.Screen name="Sessions" component={SessionsScreen} options={{ tabBarIcon: tabIcon('event-available') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('person') }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={screenOpts}>
      <Tab.Screen name="Overview" component={AdminDashboard} options={{ tabBarIcon: tabIcon('dashboard') }} />
      <Tab.Screen name="Verification" component={AdminVerification} options={{ tabBarIcon: tabIcon('verified-user') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('person') }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user } = useAuth();
  const MainTabs = user?.role === 'admin' ? AdminTabs : user?.role === 'mentor' ? MentorTabs : MenteeTabs;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="MentorProfile" component={MentorProfileScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="Booking" component={BookingScreen} options={{ presentation: 'card' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
