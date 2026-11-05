import React from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { useTheme } from '@/styles/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'ghost';
type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  /** Optional text shown beside the label for non-color status (e.g. a check). */
  leading?: React.ReactNode;
};

export function AppButton({ label, onPress, variant = 'primary', loading, disabled, accessibilityHint, style, leading }: Props) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const inactive = disabled || loading;

  const bg = variant === 'primary' ? theme.colors.accent : variant === 'secondary' ? theme.colors.surfaceElevated : 'transparent';
  const fg = variant === 'primary' ? theme.colors.accentText : theme.colors.text;
  const border = variant === 'ghost' ? theme.colors.border : 'transparent';

  return (
    <Animated.View style={[anim, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!inactive, busy: !!loading }}
        disabled={inactive}
        onPress={onPress}
        onPressIn={() => (scale.value = withTiming(MOTION.pressScale, { duration: MOTION.fast }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: MOTION.fast }))}
        style={{
          minHeight: MIN_TOUCH_TARGET + 6,
          paddingHorizontal: SPACING.xl,
          borderRadius: RADII.pill,
          backgroundColor: bg,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: SPACING.sm,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {loading ? <ActivityIndicator color={fg} /> : leading}
        <AppText variant="button" color={fg}>
          {label}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

export function Spacer({ h = SPACING.lg }: { h?: number }) {
  return <View style={{ height: h }} />;
}
