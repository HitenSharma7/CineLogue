import React from 'react';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StateView } from '@/components/StateView';
import { SOCIAL } from '@/services/socialService';

/**
 * Another user's profile. <ProfileHeader/> already implements Follow /
 * Following / Unfollow (confirm) / hidden-on-own-profile, but it is only
 * mounted once a user-profile endpoint exists, so no fake user is rendered.
 */
export function UserProfileScreen() {
  return (
    <Screen>
      <ScreenHeader title="Profile" />
      <StateView
        kind="pending"
        title="User profiles aren't connected yet"
        message={`Needs a user-profile endpoint${SOCIAL.followAvailable ? '' : ' and follow/unfollow endpoints'} from the backend.`}
      />
    </Screen>
  );
}
