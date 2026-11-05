import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from './AppText';
import { MIN_TOUCH_TARGET, SPACING } from '@/constants/layout';
import { useTheme } from '@/styles/ThemeProvider';

export function ScreenHeader({ title, back = true }: { title: string; back?: boolean }) {
  const router = useRouter();
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm }}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
          style={{ minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText variant="title" color={theme.colors.text}>‹</AppText>
        </Pressable>
      ) : null}
      <AppText variant="title" accessibilityRole="header" style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </AppText>
    </View>
  );
}
