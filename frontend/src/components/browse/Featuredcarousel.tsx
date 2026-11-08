import React, { useMemo } from 'react';
import { Animated, View } from 'react-native';

import { FeaturedCard } from '@/components/browse/Genrecard';
import type { Genre } from '@/constants/genre';
import { useTheme } from '@/styles/ThemeProvider';

type Props = {
  genres: readonly Genre[];
  viewportWidth: number;
  cardWidth: number;
  cardHeight: number;
  gap: number;
  tall: boolean;
  /** Owned by the parent so the screen's ambient glow can follow the carousel. */
  scrollX: Animated.Value;
  onPress: (genre: Genre) => void;
};

/**
 * Snap-paged 3D coverflow. Neighbours turn toward the centre, shrink and dim;
 * the artwork inside each card drifts at a different speed (parallax).
 */
export function FeaturedCarousel({ genres, viewportWidth, cardWidth, cardHeight, gap, tall, scrollX, onPress }: Props) {
  const { theme } = useTheme();
  const snap = cardWidth + gap;
  const side = Math.max(0, (viewportWidth - cardWidth) / 2);

  const onScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true }),
    [scrollX],
  );

  return (
    <View>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snap}
        decelerationRate="fast"
        disableIntervalMomentum
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{ paddingHorizontal: side, paddingTop: 20, paddingBottom: 36, gap }}
      >
        {genres.map((genre, index) => (
          <FeaturedCard
            key={genre.slug}
            genre={genre}
            index={index}
            total={genres.length}
            width={cardWidth}
            height={cardHeight}
            snap={snap}
            scrollX={scrollX}
            tall={tall}
            onPress={onPress}
          />
        ))}
      </Animated.ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: -8 }}>
        {genres.map((genre, i) => {
          const inputRange = [(i - 1) * snap, i * snap, (i + 1) * snap];
          return (
            <Animated.View
              key={genre.slug}
              style={{
                width: 22,
                height: 3,
                borderRadius: 2,
                backgroundColor: theme.colors.text,
                opacity: scrollX.interpolate({ inputRange, outputRange: [0.25, 1, 0.25], extrapolate: 'clamp' }),
                transform: [
                  { scaleX: scrollX.interpolate({ inputRange, outputRange: [0.45, 1, 0.45], extrapolate: 'clamp' }) },
                ],
              }}
            />
          );
        })}
      </View>
    </View>
  );
}