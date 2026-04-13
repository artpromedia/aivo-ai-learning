import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Nunito-SemiBold',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="brain/[childId]/index"
        options={{
          title: 'Brain',
          tabBarIcon: ({ color, size }) => <Ionicons name="bulb" size={size} color={color} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="brain/[childId]/[domain]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="brain/[childId]/history"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => <Ionicons name="mail" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tutors"
        options={{
          title: 'Tutors',
          tabBarIcon: ({ color, size }) => <Ionicons name="school" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="iep/[childId]" options={{ href: null }} />
      <Tabs.Screen name="progress/[childId]" options={{ href: null }} />
      <Tabs.Screen name="session/[childId]" options={{ href: null }} />
      <Tabs.Screen name="colearn/[childId]" options={{ href: null }} />
      <Tabs.Screen name="onboard" options={{ href: null }} />
      <Tabs.Screen name="team/[childId]" options={{ href: null }} />
      <Tabs.Screen name="billing" options={{ href: null }} />
    </Tabs>
  );
}
