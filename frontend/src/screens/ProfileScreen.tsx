import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { SPACING } from '@/constants/layout';

export function ProfileScreen() {
  const router = useRouter();
  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header" style={{ padding: SPACING.lg }}>Profile</AppText>
      <StateView
        kind="pending"
        title="Sign in to see your profile"
        message="Your profile, followers, Taste DNA and reviews need the account backend. Sign-in isn't connected yet."
      />
      <View style={{ paddingHorizontal: SPACING.xl, gap: SPACING.md }}>
        <AppButton label="Sign in" onPress={() => router.push('/login')} />
        <AppButton label="Create account" variant="ghost" onPress={() => router.push('/signup')} />
        <AppButton label="Settings" variant="ghost" onPress={() => router.push('/settings')} />
      </View>
    </Screen>
  );
}
