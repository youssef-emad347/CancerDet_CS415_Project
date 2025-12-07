import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next'; // Added

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const { t } = useTranslation(); // Added
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light']; // Get current theme colors

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.primary, // Use primary brand color for active icon/label
        tabBarInactiveTintColor: themeColors.icon, // Use icon color for inactive
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: 'transparent', // Make tabBarStyle transparent so tabBarBackground can show
          borderTopWidth: 1,
          borderTopColor: themeColors.border, // Apply theme border color
          ...Platform.select({
            ios: {
              position: 'absolute', // For iOS blur effect (if re-added), but with solid background now
            },
            default: {},
          }),
        },
        tabBarBackground: () => ( // Custom background component
          <View style={{ flex: 1, backgroundColor: themeColors.background }} />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('navigation.chat'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}