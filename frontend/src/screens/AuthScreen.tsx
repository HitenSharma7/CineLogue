import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { LogoMark, Wordmark } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { BRAND } from '@/config/brand';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '@/constants/layout';
import { signIn, signUp } from '@/services/authService';
import { useTheme } from '@/styles/ThemeProvider';

type Mode = 'login' | 'signup';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(mode: Mode, v: { name: string; email: string; password: string; confirm: string }) {
  const e: Partial<Record<'name' | 'email' | 'password' | 'confirm', string>> = {};
  if (mode === 'signup' && v.name.trim().length < 2) e.name = 'Enter your name (at least 2 characters).';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.';
  if (v.password.length < 8) e.password = 'Password must be at least 8 characters.';
  if (mode === 'signup' && v.confirm !== v.password) e.confirm = 'Passwords do not match.';
  return e;
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  secure?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoComplete?: 'email' | 'password' | 'new-password' | 'name';
  inputRef?: React.RefObject<TextInput | null>;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done';
}) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: SPACING.xs }}>
      <AppText variant="caption" muted>{props.label}</AppText>
      <TextInput
        ref={props.inputRef}
        value={props.value}
        onChangeText={props.onChangeText}
        secureTextEntry={props.secure}
        keyboardType={props.keyboardType}
        autoComplete={props.autoComplete}
        autoCapitalize={props.keyboardType === 'email-address' ? 'none' : props.autoComplete === 'name' ? 'words' : 'none'}
        autoCorrect={false}
        returnKeyType={props.returnKeyType}
        onSubmitEditing={props.onSubmitEditing}
        accessibilityLabel={props.label}
        placeholderTextColor={theme.colors.textMuted}
        style={{
          minHeight: MIN_TOUCH_TARGET + 6,
          paddingHorizontal: SPACING.lg,
          borderRadius: RADII.md,
          borderWidth: props.error ? 2 : 1,
          borderColor: props.error ? theme.colors.danger : theme.colors.border,
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          fontSize: 16,
        }}
      />
      {props.error ? <AppText variant="caption" color={theme.colors.danger}>⚠ {props.error}</AppText> : null}
    </View>
  );
}

export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<TextInput | null>(null);
  const passRef = useRef<TextInput | null>(null);
  const confirmRef = useRef<TextInput | null>(null);
  const isSignup = mode === 'signup';

  const submit = async () => {
    const e = validate(mode, { name, email, password, confirm });
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    try {
      if (isSignup) await signUp({ name: name.trim(), email: email.trim(), password });
      else await signIn({ email: email.trim(), password });
      router.replace('/(tabs)/home'); // unreachable until a real auth service exists
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, padding: SPACING.xl, gap: SPACING.lg, justifyContent: 'center', maxWidth: 480, width: '100%', alignSelf: 'center' }}
        >
          <View style={{ alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
            <LogoMark size={64} />
            <Wordmark size={24} />
            <AppText muted>{BRAND.tagline}</AppText>
          </View>
          <AppText variant="title" accessibilityRole="header">{isSignup ? 'Create your account' : 'Welcome back'}</AppText>

          {isSignup ? (
            <Field label="Name" value={name} onChangeText={setName} error={errors.name} autoComplete="name" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />
          ) : null}
          <Field label="Email" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoComplete="email" inputRef={emailRef} returnKeyType="next" onSubmitEditing={() => passRef.current?.focus()} />
          <Field label="Password" value={password} onChangeText={setPassword} error={errors.password} secure autoComplete={isSignup ? 'new-password' : 'password'} inputRef={passRef} returnKeyType={isSignup ? 'next' : 'done'} onSubmitEditing={isSignup ? () => confirmRef.current?.focus() : submit} />
          {isSignup ? (
            <Field label="Confirm password" value={confirm} onChangeText={setConfirm} error={errors.confirm} secure autoComplete="new-password" inputRef={confirmRef} returnKeyType="done" onSubmitEditing={submit} />
          ) : null}

          {formError ? (
            <View accessibilityLiveRegion="assertive" style={{ padding: SPACING.md, borderRadius: RADII.md, borderWidth: 1, borderColor: theme.colors.danger }}>
              <AppText color={theme.colors.danger}>⚠ {formError}</AppText>
            </View>
          ) : null}

          <AppButton label={isSignup ? 'Create account' : 'Sign in'} loading={loading} onPress={submit} />
          <Pressable
            accessibilityRole="link"
            onPress={() => router.replace(isSignup ? '/login' : '/signup')}
            style={{ minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center' }}
          >
            <AppText muted>{isSignup ? 'Already have an account? ' : 'New here? '}<AppText color={theme.colors.text} style={{ fontWeight: '700' }}>{isSignup ? 'Sign in' : 'Create an account'}</AppText></AppText>
          </Pressable>
          <AppButton label="Continue as guest" variant="ghost" onPress={() => router.replace('/(tabs)/home')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
