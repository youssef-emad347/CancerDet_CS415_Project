import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import '@/i18n'; // Initialize i18n
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/auth';
import { Colors } from '@/constants/theme'; // Import Colors

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const navigationTheme = {
    ...DefaultTheme,
    dark: colorScheme === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: themeColors.primary,
      background: themeColors.background,
      card: themeColors.surface, // For header background
      text: themeColors.text,
      border: themeColors.border,
      notification: themeColors.accent, // Example for other uses
    },
  };

  return (
    <AuthProvider>
      <ThemeProvider value={navigationTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="edit-profile" 
            options={{ 
              presentation: 'modal', 
              title: 'Edit Profile',
              headerStyle: {
                backgroundColor: themeColors.surface, // Use surface for header background
              },
              headerTintColor: themeColors.text, // Color for back button and title
              headerTitleStyle: {
                color: themeColors.text,
              },
            }} 
          />
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal', 
              title: 'Modal',
              headerStyle: {
                backgroundColor: themeColors.surface,
              },
              headerTintColor: themeColors.text,
              headerTitleStyle: {
                color: themeColors.text,
              },
            }} 
          />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
