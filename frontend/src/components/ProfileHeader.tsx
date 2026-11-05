import React from 'react';
import { Alert, View } from 'react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { RADII, SPACING } from '@/constants/layout';
import { followUiState, visibleCount } from '@/helpers/profileRules';
import { useTheme } from '@/styles/ThemeProvider';

type Props = {
  displayName: string;
  bio?: string | null;
  isOwnProfile: boolean;
  followSupported: boolean;
  isFollowing: boolean | null;
  followersCount?: number | null;
  followingCount?: number | null;
  busy?: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
};

/** Implements the Follow / Following / Unfollow rules. Pure UI; actions are injected. */
export function ProfileHeader(p: Props) {
  const { theme } = useTheme();
  const ui = followUiState({ isOwnProfile: p.isOwnProfile, followSupported: p.followSupported, isFollowing: p.isFollowing });
  const followers = visibleCount(p.followersCount);
  const following = visibleCount(p.followingCount);

  const confirmUnfollow = () =>
    Alert.alert(`Unfollow ${p.displayName}?`, 'You will stop seeing their activity.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unfollow', style: 'destructive', onPress: p.onUnfollow },
    ]);

  return (
    <View style={{ padding: SPACING.lg, gap: SPACING.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.lg }}>
        <View
          accessibilityElementsHidden
          style={{ width: 72, height: 72, borderRadius: RADII.pill, backgroundColor: theme.colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText variant="title">{p.displayName.trim().charAt(0).toUpperCase() || '?'}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="title" numberOfLines={1}>{p.displayName}</AppText>
          {followers !== null || following !== null ? (
            <View style={{ flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.xs }}>
              {followers !== null ? <AppText muted>{followers} followers</AppText> : null}
              {following !== null ? <AppText muted>{following} following</AppText> : null}
            </View>
          ) : null}
        </View>
      </View>
      {p.bio ? <AppText muted>{p.bio}</AppText> : null}
      {ui === 'follow' ? <AppButton label="Follow" loading={p.busy} onPress={p.onFollow} /> : null}
      {ui === 'following' ? (
        <AppButton
          label="Following"
          variant="ghost"
          loading={p.busy}
          leading={<AppText color={theme.colors.text}>✓</AppText>}
          accessibilityHint="Double tap to unfollow"
          onPress={confirmUnfollow}
        />
      ) : null}
    </View>
  );
}
