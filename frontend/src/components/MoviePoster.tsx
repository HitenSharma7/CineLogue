import React, { memo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from './AppText';
import { POSTER_ASPECT, RADII, SPACING } from '@/constants/layout';
import { useTheme } from '@/styles/ThemeProvider';

type Props = {
  uri: string | null;
  title: string;
  year?: number | null;
  width: number;
  onPress?: () => void;
  showCaption?: boolean;
};

/** Poster with fixed aspect ratio (no layout shift), cache, and failure fallback. */
function MoviePosterBase({ uri, title, year, width, onPress, showCaption = true }: Props) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);
  const height = Math.round(width / POSTER_ASPECT);
  const missing = !uri || failed;
  const label = year ? `${title}, ${year}` : title;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Opens details"
      onPress={onPress}
      style={({ pressed }) => ({ width, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
    >
      <View
        style={{
          width,
          height,
          borderRadius: RADII.md,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceElevated,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING.sm,
        }}
      >
        {missing ? (
          <AppText variant="caption" muted style={{ textAlign: 'center' }} numberOfLines={4}>
            {title}
          </AppText>
        ) : (
          <Image
            source={{ uri }}
            style={{ width, height }}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={uri}
            accessibilityIgnoresInvertColors
            onError={() => setFailed(true)}
          />
        )}
      </View>
      {showCaption ? (
        <View style={{ paddingTop: SPACING.sm }}>
          <AppText variant="caption" numberOfLines={2}>{title}</AppText>
          {year ? <AppText variant="caption" muted>{year}</AppText> : null}
        </View>
      ) : null}
    </Pressable>
  );
}
export const MoviePoster = memo(MoviePosterBase);
