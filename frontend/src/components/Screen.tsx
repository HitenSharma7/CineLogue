import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_CONTENT_WIDTH } from '@/constants/layout';
import { useTheme } from '@/styles/ThemeProvider';

/** Themed screen root with safe-area padding and a centered max-width column. */
export function Screen({
  children,
  edges = ['top'],
  style,
}: {
  children: React.ReactNode;
  edges?: ('top' | 'bottom')[];
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: edges.includes('top') ? insets.top : 0,
        paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
        alignItems: 'center',
      }}
    >
      <View style={[{ flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH }, style]}>{children}</View>
    </View>
  );
}
