import { NotConfiguredError } from './notConfigured';

/**
 * Integration boundary for user search and follow/unfollow. No backend
 * contract exists yet; flags stay false so the UI never offers actions that
 * cannot work, and calls reject rather than fake success.
 */
export const SOCIAL = {
  userSearchAvailable: false,
  followAvailable: false,
} as const;

export type UserSummary = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export async function searchUsers(_q: string, _signal?: AbortSignal): Promise<UserSummary[]> {
  throw new NotConfiguredError('User search');
}
export async function followUser(_userId: string): Promise<void> {
  throw new NotConfiguredError('Follow');
}
export async function unfollowUser(_userId: string): Promise<void> {
  throw new NotConfiguredError('Unfollow');
}
