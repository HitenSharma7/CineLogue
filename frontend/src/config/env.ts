
import { Platform } from 'react-native';

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

function defaultBaseUrl(): string {
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'
    : 'http://localhost:5000';
}

const rawBase = process.env.EXPO_PUBLIC_API_URL?.trim();
const rawMovies = process.env.EXPO_PUBLIC_MOVIES_PATH?.trim();

export const ENV = {
  apiBaseUrl: trimSlash(
    rawBase && rawBase.length > 0
      ? rawBase
      : defaultBaseUrl(),
  ),

  moviesPath:
    '/' +
    (
      rawMovies && rawMovies.length > 0
        ? rawMovies
        : '/api/v1/movies'
    ).replace(/^\/+|\/+$/g, ''),

  requestTimeoutMs: 15000,
} as const;
