import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '@/styles/ThemeProvider';

type IconName = { ios: string; android: string; web: string };
const ICONS: Record<string, IconName> = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  discover: { ios: 'safari.fill', android: 'explore', web: 'explore' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  watchlist: { ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' },
  profile: { ios: 'person.fill', android: 'person', web: 'person' },
};

/** Icon with a soft accent pill behind it when focused (shape + colour, not colour alone). */
function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: 54,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? `${theme.colors.accent}33` : 'transparent',
      }}
    >
      {/* Cast: SF Symbol typing is strict; the names above are valid SF / Material symbols. */}
      <SymbolView name={ICONS[name] as never} tintColor={focused ? theme.colors.accent : color} size={22} />
    </View>
  );
}

const icon =
  (name: keyof typeof ICONS) =>
  // eslint-disable-next-line react/display-name
  ({ color, focused }: { color: string; focused: boolean }) =>
    <TabIcon name={name} color={color} focused={focused} />;

export default function TabsLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: { backgroundColor: theme.colors.tabBar, borderTopColor: theme.colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: icon('discover') }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: icon('search') }} />
      <Tabs.Screen name="watchlist" options={{ title: 'Watchlist', tabBarIcon: icon('watchlist') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('profile') }} />
    </Tabs>
  );
}
