import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import Svg, { Path } from 'react-native-svg';
import { AuthProvider } from '@/contexts/AuthContext';

export default function TabLayout() {
  return (
    <AuthProvider>
      <Tabs
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#5ced73',  // Active tab color
          tabBarInactiveTintColor: '#ffffff',    // Inactive tab color
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: '',
            tabBarLabel: '', // Remove text
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="authentication"
          options={{
            title: '',
            tabBarLabel: '', // Remove text
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'log-in' : 'log-in-outline'} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="aboutus"
          options={{
            title: '',
            tabBarLabel: '', // Remove text
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'information-circle' : 'information-circle-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="booking"
          options={{
            title: '',
            tabBarLabel: '',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'calendar' : 'calendar-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"  // This should match the filename of your MapScreen (i.e., app/map.tsx)
          options={{
            title: '',
            tabBarLabel: '', // Remove text
            tabBarIcon: ({ color, focused }) => (
              <MapTabIcon focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="payment"
          options={{
            title: '',
            tabBarLabel: '', // Remove text
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'card' : 'card-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '',
            tabBarLabel: '', // Remove text
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
            ),
          }}
        />
      </Tabs>
    </AuthProvider>
  );
}

const MapTabIcon = ({ focused, color }) => (
  <Svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} style={styles.icon}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <Path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </Svg>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000', // Dark background for the tab bar
    position: 'absolute',
    bottom: 90, // Lift the tab bar from the bottom corner
    elevation: 5, // Slight elevation for shadow effect
    borderTopLeftRadius: 30, // Rounded corners on the top left
    borderTopRightRadius: 30, // Rounded corners on the top right
    borderBottomLeftRadius: 30, // Rounded corners on the bottom left
    borderBottomRightRadius: 30, // Rounded corners on the bottom right
    paddingVertical: 12, // Slightly more padding for better balance
    shadowColor: '#000',
    shadowOpacity: 0.2, // Light shadow opacity
    shadowOffset: { width: 0, height: -5 }, // Shadow lifted upwards
    shadowRadius: 10, // Softer shadow effect
    width: '85%', // Use 85% width for the tab bar
    alignSelf: 'center', // Ensure the tab bar is centered
    marginHorizontal: '7.5%', // Center it horizontally with equal margins
  },
  icon: {
    width: 24,
    height: 24,
  },
});