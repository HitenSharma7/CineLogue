export type FollowUi = 'hidden' | 'follow' | 'following';

/**
 * Pure rules for the profile action button:
 *  - own profile        -> never show a follow control
 *  - follow unsupported -> hidden
 *  - already following  -> "Following" (tapping offers Unfollow with confirmation)
 *  - otherwise          -> "Follow"
 */
export function followUiState(args: {
  isOwnProfile: boolean;
  followSupported: boolean;
  isFollowing: boolean | null; // null = unknown
}): FollowUi {
  if (args.isOwnProfile || !args.followSupported) return 'hidden';
  return args.isFollowing ? 'following' : 'follow';
}

/** Counts are shown only when real data exists (a number, not null/undefined). */
export function visibleCount(n: number | null | undefined): string | null {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? String(n) : null;
}
