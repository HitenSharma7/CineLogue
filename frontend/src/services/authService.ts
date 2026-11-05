import { NotConfiguredError } from './notConfigured';

/**
 * Integration boundary for authentication. NO backend contract has been
 * provided, so every call fails honestly instead of pretending to succeed.
 * Flip AUTH_CONFIGURED and implement these once the contract exists.
 */
export const AUTH_CONFIGURED = false;

export type Credentials = { email: string; password: string };
export type SignupInput = Credentials & { name: string };

export async function signIn(_input: Credentials): Promise<never> {
  throw new NotConfiguredError('Sign-in');
}
export async function signUp(_input: SignupInput): Promise<never> {
  throw new NotConfiguredError('Sign-up');
}
