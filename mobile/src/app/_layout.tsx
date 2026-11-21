import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/lib/auth';

SplashScreen.preventAutoHideAsync();

function Routes() {
  const { ready, session } = useAuth();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[slug]" />
        <Stack.Screen name="lesson/[id]" />
        <Stack.Screen name="assignment/[id]" />
        <Stack.Screen name="doubts" />
        <Stack.Screen name="attendance" />
        <Stack.Screen name="fees" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="certificates" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Routes />
    </AuthProvider>
  );
}
