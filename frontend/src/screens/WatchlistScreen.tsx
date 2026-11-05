import React from 'react';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { SPACING } from '@/constants/layout';

export function WatchlistScreen() {
  const router = useRouter();
  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header" style={{ padding: SPACING.lg }}>Watchlist</AppText>
      <StateView
        kind="pending"
        title="Your watchlist isn't connected yet"
        message="Saving titles needs user accounts and a watchlist endpoint from the backend. Nothing is saved on this device or fake-saved."
        actionLabel="Discover titles"
        onAction={() => router.push('/(tabs)/discover')}
      />
    </Screen>
  );
}
