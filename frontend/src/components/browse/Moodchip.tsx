import React, { memo } from 'react';

import { AppText } from '@/components/AppText';
import { Orb } from '@/components/browse/Glyphs';
import { PressableScale } from '@/components/browse/Pressablescale';
import { paletteOf, type Genre, type Mood } from '@/constants/genre';
import { useTheme } from '@/styles/ThemeProvider';
import { withAlpha } from '@/utils/color';

type Props = {
  mood: Mood;
  genre: Genre;
  onPress: (genre: Genre) => void;
};

/** Pill chip: a small glossy orb in the mood's accent colour plus its label. */
export const MoodChip = memo(function MoodChip({ mood, genre, onPress }: Props) {
  const { theme } = useTheme();
  const pal = paletteOf(genre.accent);

  return (
    <PressableScale
      onPress={() => onPress(genre)}
      accessibilityRole="button"
      accessibilityLabel={`${mood.label}. ${mood.hint}`}
      style={{
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: withAlpha(pal.base, 0.14),
        borderWidth: 1,
        borderColor: withAlpha(pal.glow, 0.38),
      }}
      contentStyle={{
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingLeft: 10,
        paddingRight: 20,
      }}
    >
      <Orb size={28} color={pal.glow} />
      <AppText
        color={theme.colors.text}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
        style={{ fontWeight: '700', fontSize: 14 }}
      >
        {mood.label}
      </AppText>
    </PressableScale>
  );
});