import { storage } from '@/helpers/storage';

const ONBOARDED_KEY = 'cinelogue.onboarded';

/** Module-level so the splash is shown once per app launch, not on re-render/navigation. */
let splashShownThisLaunch = false;
export const splashAlreadyShown = () => splashShownThisLaunch;
export const markSplashShown = () => {
  splashShownThisLaunch = true;
};

export async function hasOnboarded(): Promise<boolean> {
  return (await storage.getItem(ONBOARDED_KEY)) === '1';
}
export async function setOnboarded(): Promise<void> {
  await storage.setItem(ONBOARDED_KEY, '1');
}
