import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { hasOnboarded } from '@/hooks/AppFlow';
import { useTheme } from '@/styles/ThemeProvider';

export default function Index() {
  const router = useRouter();
  const { theme } = useTheme();
  useEffect(() => {
    let alive = true;
    hasOnboarded().then((seen) => {
      if (alive) router.replace(seen ? '/(tabs)/home' : '/onboarding');
    });
    return () => {
      alive = false;
    };
  }, [router]);
  return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
}
