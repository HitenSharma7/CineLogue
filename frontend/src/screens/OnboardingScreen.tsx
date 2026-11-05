import React, { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { LogoMark } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { BRAND } from '@/config/brand';
import { RADII, SPACING } from '@/constants/layout';
import { setOnboarded } from '@/hooks/AppFlow';
import { useReducedMotionPref } from '@/hooks/useReducedMotionPref';
import { useTheme } from '@/styles/ThemeProvider';

// Copy only: describes the product direction. Items marked "soon" depend on backend work.
const PAGES = [
  { title: 'Find your next watch', body: 'Search movies and series and open full details in a couple of taps.' },
  { title: 'Keep track of what you love', body: 'Watchlists, ratings and reviews are on the way, once the backend supports them.' },
  { title: 'Taste, shared', body: 'Taste DNA and following fellow cinephiles are planned. We only show real data, never made-up activity.' },
];

export function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const reduce = useReducedMotionPref();
  const [i, setI] = useState(0);
  const last = i === PAGES.length - 1;

  const finish = async (to: '/(tabs)/home' | '/login') => {
    await setOnboarded();
    router.replace(to);
  };

  return (
    <Screen edges={['top', 'bottom']} style={{ padding: SPACING.xl, justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center', gap: SPACING.md, marginTop: SPACING.xl }}>
        <LogoMark size={72} />
        <AppText muted variant="caption" style={{ letterSpacing: 2, textTransform: 'uppercase' }}>{BRAND.tagline}</AppText>
      </View>

      <Animated.View
        key={i}
        entering={reduce ? undefined : FadeIn.duration(250)}
        exiting={reduce ? undefined : FadeOut.duration(120)}
        style={{ gap: SPACING.md }}
      >
        <AppText variant="display" accessibilityRole="header">{PAGES[i].title}</AppText>
        <AppText muted>{PAGES[i].body}</AppText>
      </Animated.View>

      <View style={{ gap: SPACING.lg }}>
        <View accessible accessibilityLabel={`Page ${i + 1} of ${PAGES.length}`} style={{ flexDirection: 'row', gap: SPACING.sm, justifyContent: 'center' }}>
          {PAGES.map((_, k) => (
            <View
              key={k}
              style={{
                width: k === i ? 24 : 8,
                height: 8,
                borderRadius: RADII.pill,
                backgroundColor: k === i ? theme.colors.accent : theme.colors.border,
              }}
            />
          ))}
        </View>
        {last ? (
          <>
            <AppButton label="Start exploring" onPress={() => finish('/(tabs)/home')} />
            <AppButton label="I have an account" variant="ghost" onPress={() => finish('/login')} />
          </>
        ) : (
          <>
            <AppButton label="Next" onPress={() => setI(i + 1)} />
            <AppButton label="Skip" variant="ghost" onPress={() => finish('/(tabs)/home')} />
          </>
        )}
      </View>
    </Screen>
  );
}
