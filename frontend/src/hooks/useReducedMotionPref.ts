import { useReducedMotion } from 'react-native-reanimated';
/** Thin wrapper so screens depend on one hook, not on the animation library. */
export function useReducedMotionPref(): boolean {
  return useReducedMotion();
}
