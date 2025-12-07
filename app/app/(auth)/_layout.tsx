import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].tint,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
        }
      }}>
      <Stack.Screen
        name="login"
        options={{
          title: 'Sign In',
          headerShown: false, // Often better for login screens to have custom headers or none
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Create Account',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Reset Password',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
