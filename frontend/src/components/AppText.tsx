import React from 'react';
import { Text, type TextProps } from 'react-native';
import { TYPE, type TypeVariant } from '@/constants/typography';
import { useTheme } from '@/styles/ThemeProvider';

type Props = TextProps & { variant?: TypeVariant; muted?: boolean; color?: string };

export function AppText({ variant = 'body', muted, color, style, ...rest }: Props) {
  const { theme } = useTheme();
  return (
    <Text
      {...rest}
      style={[TYPE[variant], { color: color ?? (muted ? theme.colors.textMuted : theme.colors.text) }, style]}
    />
  );
}
