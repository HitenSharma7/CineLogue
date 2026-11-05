import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import { BRAND } from '@/config/brand';
import { useTheme } from '@/styles/ThemeProvider';

/** Vector-free logo mark: a film-frame glyph built from Views, plus wordmark. */
export function LogoMark({ size = 64 }: { size?: number }) {
  const { theme } = useTheme();
  const hole = Math.max(3, Math.round(size / 12));
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${BRAND.displayName} logo`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        backgroundColor: theme.colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {[0, 1].map((side) => (
        <View
          key={side}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            [side === 0 ? 'left' : 'right']: size * 0.07,
            justifyContent: 'space-evenly',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ width: hole, height: hole, borderRadius: 1, backgroundColor: theme.colors.accentText, opacity: 0.55 }} />
          ))}
        </View>
      ))}
      <AppText color={theme.colors.accentText} style={{ fontSize: size * 0.5, lineHeight: size * 0.6, fontWeight: '900' }} allowFontScaling={false}>
        C
      </AppText>
    </View>
  );
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <AppText accessibilityRole="header" style={{ fontSize: size, lineHeight: size * 1.2, fontWeight: '800', letterSpacing: size * 0.12 }}>
      {BRAND.name}
    </AppText>
  );
}
