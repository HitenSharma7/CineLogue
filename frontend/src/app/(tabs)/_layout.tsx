
import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { Tabs, router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

/* CONFIG */

type IconName = {
  ios: string;
  android: string;
  web: string;
};

const ICONS: Record<string, IconName> = {
  home: {
    ios: 'sparkles',
    android: 'auto_awesome',
    web: 'auto_awesome',
  },
  discover: {
    ios: 'safari.fill',
    android: 'explore',
    web: 'explore',
  },
  search: {
    ios: 'magnifyingglass',
    android: 'search',
    web: 'search',
  },
  watchlist: {
    ios: 'play.rectangle',
    android: 'smart_display',
    web: 'smart_display',
  },
  profile: {
    ios: 'face.smiling.fill',
    android: 'sentiment_satisfied',
    web: 'sentiment_satisfied',
  },
};

const TAB_HREFS: Record<string, Href> = {
  home: '/home',
  discover: '/discover',
  search: '/search',
  watchlist: '/watchlist',
  profile: '/profile',
};

const BAR_BG = '#0B0C12';
const ACCENT = '#087DFF';
const MUTED = '#9299AD';
const BAR_CONTENT_H = 64;

/* KEYBOARD VISIBILITY */

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvt =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';

    const hideEvt =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvt, () => {
      setVisible(true);
    });

    const hideSubscription = Keyboard.addListener(hideEvt, () => {
      setVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return visible;
}

/* TAB ITEM */

function TabItem({
  routeName,
  label,
  focused,
  iconSize,
  onPress,
}: {
  routeName: string;
  label: string;
  focused: boolean;
  iconSize: number;
  onPress: () => void;
}) {
  const isProfile = routeName === 'profile';

  const progress = useSharedValue(focused ? 1 : 0);
  const pressed = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, {
      damping: 14,
      stiffness: 160,
      mass: 0.7,
    });
  }, [focused, progress]);

  const glow = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.55 + progress.value * 0.45 }],
  }));

  const press = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.1 }],
  }));

  const iconWrap = useAnimatedStyle(() => ({
    transform: [
      { translateY: -2 * progress.value },
      { scale: 1 + progress.value * 0.1 },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 5 }],
  }));

  const icon = ICONS[routeName] ?? ICONS.home;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 90 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 160 });
      }}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      hitSlop={{ top: 6, bottom: 6 }}
      style={styles.item}
    >
      <Animated.View style={[styles.itemInner, press]}>
        <View style={styles.iconStage}>
          <Animated.View style={[styles.glowOuter, glow]} />
          <Animated.View style={[styles.glowInner, glow]} />

          <Animated.View style={iconWrap}>
            {isProfile ? (
              <LinearGradient
                colors={['#00BFFF', '#5145FF', '#B000FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.profileCircle,
                  {
                    width: iconSize + 16,
                    height: iconSize + 16,
                    borderRadius: (iconSize + 16) / 2,
                    borderColor: focused ? '#FFFFFF' : 'transparent',
                  },
                ]}
              >
                <SymbolView
                  name={icon as never}
                  tintColor="#FFFFFF"
                  size={iconSize - 3}
                />
              </LinearGradient>
            ) : (
              <SymbolView
                name={icon as never}
                tintColor={focused ? '#FFFFFF' : MUTED}
                size={iconSize}
              />
            )}
          </Animated.View>
        </View>

        <Animated.Text
          numberOfLines={1}
          style={[styles.activeLabel, labelStyle]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

/* CUSTOM TAB BAR */

function CurvedTabBar({
  state,
}: {
  state: BottomTabBarProps['state'];
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const keyboardVisible = useKeyboardVisible();

  if (keyboardVisible) {
    return null;
  }

  const isWide = width >= 700;
  const iconSize = isWide ? 30 : 26;
  const bottomPad = Math.max(insets.bottom, 8);

  const D = Math.max(width, 320) * 8;

  return (
    <View style={{ height: BAR_CONTENT_H + bottomPad }}>
      {/* Curved background and blue border */}

      <View
        style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
        pointerEvents="none"
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: -(D - width) / 2,
            width: D,
            height: D,
            borderRadius: D / 2,
            backgroundColor: BAR_BG,
            borderWidth: 2.5,
            borderColor: ACCENT,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={[
              'rgba(8,125,255,0.38)',
              'rgba(8,125,255,0)',
            ]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 30,
            }}
          />
        </View>
      </View>

      {/* Navigation items */}

      <View
        style={[
          styles.row,
          {
            height: BAR_CONTENT_H,
            maxWidth: isWide ? 560 : undefined,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;

          const label =
            route.name.charAt(0).toUpperCase() + route.name.slice(1);

          const onPress = () => {
            if (!focused) {
              const href = TAB_HREFS[route.name];

              if (href) {
                router.navigate(href);
              }
            }
          };

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              label={label}
              focused={focused}
              iconSize={iconSize}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

/* LAYOUT */

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <CurvedTabBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home' }}
      />

      <Tabs.Screen
        name="discover"
        options={{ title: 'Discover' }}
      />

      <Tabs.Screen
        name="search"
        options={{ title: 'Search' }}
      />

      <Tabs.Screen
        name="watchlist"
        options={{ title: 'Watchlist' }}
      />

      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />
    </Tabs>
  );
}

/* STYLES */

const styles = StyleSheet.create({
  row: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },

  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },

  iconStage: {
    width: 56,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  glowOuter: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(8,125,255,0.10)',
  },

  glowInner: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(8,125,255,0.22)',
  },

  profileCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },

  activeLabel: {
    height: 14,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
