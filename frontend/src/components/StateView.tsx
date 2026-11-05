import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { SPACING } from '@/constants/layout';
import { useTheme } from '@/styles/ThemeProvider';

type Props = {
  kind: 'loading' | 'empty' | 'error' | 'pending';
  title?: string;
  message?: string;
  onRetry?: () => void;
  actionLabel?: string;
  onAction?: () => void;
};

/** One component for every non-content state. "pending" = backend not wired yet. */
export function StateView({ kind, title, message, onRetry, actionLabel, onAction }: Props) {
  const { theme } = useTheme();
  const glyph = kind === 'error' ? '!' : kind === 'pending' ? '…' : kind === 'empty' ? '○' : '';
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl, gap: SPACING.md }}
    >
      {kind === 'loading' ? (
        <ActivityIndicator color={theme.colors.accent} accessibilityLabel="Loading" />
      ) : (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            borderWidth: 2,
            borderColor: kind === 'error' ? theme.colors.danger : theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText variant="title" color={kind === 'error' ? theme.colors.danger : theme.colors.textMuted}>
            {glyph}
          </AppText>
        </View>
      )}
      {title ? <AppText variant="heading" style={{ textAlign: 'center' }}>{title}</AppText> : null}
      {message ? <AppText muted style={{ textAlign: 'center', maxWidth: 420 }}>{message}</AppText> : null}
      {kind === 'error' && onRetry ? <AppButton label="Try again" variant="secondary" onPress={onRetry} /> : null}
      {actionLabel && onAction ? <AppButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}
