import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { LogoMark, Wordmark } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { BRAND } from '@/config/brand';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '@/constants/layout';
import { useReducedMotionPref } from '@/hooks/useReducedMotionPref';
import { signIn, signUp } from '@/services/authService';
import { useTheme } from '@/styles/ThemeProvider';

type NativeTextInput = React.ComponentRef<typeof TextInput>;

type Mode = 'login' | 'signup';
type FieldKey = 'name' | 'email' | 'password' | 'confirm';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(mode: Mode, v: { name: string; email: string; password: string; confirm: string }) {
  const e: Partial<Record<FieldKey, string>> = {};
  if (mode === 'signup' && v.name.trim().length < 2) e.name = 'Enter your name (at least 2 characters).';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.';
  if (v.password.length < 8) e.password = 'Password must be at least 8 characters.';
  if (mode === 'signup' && v.confirm !== v.password) e.confirm = 'Passwords do not match.';
  return e;
}

/** Safe "color with alpha" for hex or rgb() colors. */
function withAlpha(color: string | undefined, a: number): string {
  const c = color ?? '#0B0B0F';
  if (c.startsWith('#')) {
    let h = c.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split('').map((x) => x + x).join('');
    if (h.length >= 6) {
      return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
    }
  }
  const m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${a})`;
  return `rgba(11,11,15,${a})`;
}

function passwordScore(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
  return s; // 0..4
}

const TILE_GRADIENTS: [string, string][] = [
  ['#7A0C14', '#1A0508'],
  ['#12304D', '#050B14'],
  ['#3B1C5A', '#0C0614'],
  ['#0F4C45', '#04120F'],
  ['#5A3A12', '#140D04'],
  ['#4A1230', '#12040B'],
];

/* ───────────────────────── Ambient backdrop ───────────────────────── */

function Backdrop({ bg, accent, reduce }: { bg: string; accent: string; reduce: boolean }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    pulse.value = withRepeat(withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduce, pulse]);

  const orb = useAnimatedStyle(() => ({
    opacity: 0.75 + pulse.value * 0.25,
    transform: [{ scale: 1 + pulse.value * 0.1 }],
  }));

  const offsets = [0, -46, 22];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Faint tilted poster tiles echo the onboarding wall */}
      <View
        style={{
          position: 'absolute',
          top: -50,
          left: -50,
          right: -50,
          height: 360,
          flexDirection: 'row',
          gap: 10,
          opacity: 0.3,
          transform: [{ rotate: '-8deg' }],
        }}
      >
        {offsets.map((off, c) => (
          <View key={c} style={{ flex: 1, gap: 10, marginTop: off }}>
            {Array.from({ length: 4 }, (_, k) => (
              <LinearGradient
                key={k}
                colors={TILE_GRADIENTS[(c * 2 + k) % TILE_GRADIENTS.length]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={{ aspectRatio: 2 / 3, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
              />
            ))}
          </View>
        ))}
      </View>

      <LinearGradient
        colors={[withAlpha(bg, 0.35), withAlpha(bg, 0.9), bg]}
        locations={[0, 0.55, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}
      />

      {/* Layered circles fake a soft radial glow */}
      <Animated.View style={[{ position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center' }, orb]}>
        {[360, 250, 150].map((s, k) => (
          <View
            key={s}
            style={{
              position: 'absolute',
              top: (360 - s) / 2,
              width: s,
              height: s,
              borderRadius: s / 2,
              backgroundColor: withAlpha(accent, [0.05, 0.08, 0.14][k]),
            }}
          />
        ))}
      </Animated.View>
    </View>
  );
}

/* ───────────────────────── Mode switch ───────────────────────── */

function ModeSwitch({ mode, accent, onChange }: { mode: Mode; accent: string; onChange: (m: Mode) => void }) {
  const { theme } = useTheme();
  const c = theme.colors as any;
  const items: { key: Mode; label: string }[] = [
    { key: 'login', label: 'Sign in' },
    { key: 'signup', label: 'Sign up' },
  ];
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        padding: 4,
        borderRadius: RADII.pill,
        backgroundColor: withAlpha(c.surface, 0.9),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {items.map((it) => {
        const active = it.key === mode;
        return (
          <Pressable
            key={it.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => !active && onChange(it.key)}
            style={{
              flex: 1,
              minHeight: MIN_TOUCH_TARGET - 6,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: RADII.pill,
              backgroundColor: active ? accent : 'transparent',
            }}
          >
            <AppText style={{ fontWeight: '700', color: active ? '#fff' : c.textMuted }}>{it.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ───────────────────────── Floating-label field ───────────────────────── */

function Field(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  error?: string;
  secure?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoComplete?: 'email' | 'password' | 'new-password' | 'name';
  inputRef?: React.Ref<NativeTextInput>;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done';
}) {
  const { theme } = useTheme();
  const c = theme.colors as any;
  const accent: string = c.accent ?? '#C40000';
  const danger: string = c.danger ?? '#FF5A5F';
  const muted: string = c.textMuted ?? '#8A8A93';
  const border: string = c.border ?? 'rgba(255,255,255,0.14)';

  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const lift = useSharedValue(props.value ? 1 : 0);
  const focus = useSharedValue(0);
  const hasError = !!props.error;

  useEffect(() => {
    lift.value = withTiming(focused || props.value.length > 0 ? 1 : 0, { duration: 170 });
    focus.value = withTiming(focused ? 1 : 0, { duration: 170 });
  }, [focused, props.value, lift, focus]);

  // Resolve theme colors on the JS thread. Worklets must not call
  // ordinary JavaScript helpers such as withAlpha() from inside callbacks.
  const normalBackground = withAlpha(c.surface, 1);
  const focusedBackground = withAlpha(accent, 0.06);

  const box = useAnimatedStyle(() => ({
    borderColor: hasError
      ? danger
      : interpolateColor(focus.value, [0, 1], [border, accent]),
    backgroundColor: interpolateColor(
      focus.value,
      [0, 1],
      [normalBackground, focusedBackground],
    ),
  }));

  const label = useAnimatedStyle(() => ({
    top: interpolate(lift.value, [0, 1], [19, 8]),
    fontSize: interpolate(lift.value, [0, 1], [16, 12]),
    color: hasError ? danger : interpolateColor(focus.value, [0, 1], [muted, accent]),
  }));

  const iconColor = hasError ? danger : focused ? accent : muted;
  const labelLeft = SPACING.lg + 20 + 12;

  return (
    <View style={{ gap: SPACING.xs }}>
      <Animated.View
        style={[
          {
            height: 60,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: SPACING.lg,
            borderRadius: RADII.md,
            borderWidth: 1.5,
          },
          box,
        ]}
      >
        <Ionicons name={props.icon} size={20} color={iconColor} style={{ marginRight: 12 }} />

        <Animated.Text
          pointerEvents="none"
          numberOfLines={1}
          style={[{ position: 'absolute', left: labelLeft, fontWeight: '500' }, label]}
        >
          {props.label}
        </Animated.Text>

        <TextInput
          ref={props.inputRef}
          value={props.value}
          onChangeText={props.onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={props.secure && !show}
          keyboardType={props.keyboardType}
          autoComplete={props.autoComplete}
          autoCapitalize={props.keyboardType === 'email-address' ? 'none' : props.autoComplete === 'name' ? 'words' : 'none'}
          autoCorrect={false}
          returnKeyType={props.returnKeyType}
          onSubmitEditing={props.onSubmitEditing}
          accessibilityLabel={props.label}
          selectionColor={accent}
          style={{ flex: 1, height: 60, paddingTop: 20, color: c.text, fontSize: 16 }}
        />

        {props.secure ? (
          <Pressable
            onPress={() => setShow((s) => !s)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={show ? 'Hide password' : 'Show password'}
          >
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={muted} />
          </Pressable>
        ) : null}
      </Animated.View>

      {props.error ? (
        <Animated.View entering={FadeIn.duration(180)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
          <Ionicons name="alert-circle" size={14} color={danger} />
          <AppText variant="caption" color={danger} style={{ flex: 1 }}>{props.error}</AppText>
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ───────────────────────── Password strength ───────────────────────── */

function StrengthMeter({ password }: { password: string }) {
  const { theme } = useTheme();
  const c = theme.colors as any;
  if (!password) return null;
  const s = passwordScore(password);
  const palette = [c.danger ?? '#FF5A5F', c.danger ?? '#FF5A5F', '#F5A623', '#8BD450', '#34C759'];
  const names = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'];
  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ gap: 6 }} accessible accessibilityLabel={`Password strength: ${names[s]}`}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4].map((n) => (
          <View
            key={n}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: n <= s ? palette[s] : 'rgba(255,255,255,0.12)',
            }}
          />
        ))}
      </View>
      <AppText variant="caption" muted>
        Password strength: <AppText variant="caption" color={palette[s]} style={{ fontWeight: '700' }}>{names[s]}</AppText>
      </AppText>
    </Animated.View>
  );
}

/* ───────────────────────── Screen ───────────────────────── */

export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { theme } = useTheme();
  const reduce = useReducedMotionPref();
  const c = theme.colors as any;
  const bg: string = c.background ?? '#0B0B0F';
  const accent: string = c.accent ?? '#C40000';
  const danger: string = c.danger ?? '#FF5A5F';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<NativeTextInput>(null);
  const passRef = useRef<NativeTextInput>(null);
  const confirmRef = useRef<NativeTextInput>(null);
  const isSignup = mode === 'signup';

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const shake = () => {
    if (reduce) return;
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withRepeat(withTiming(10, { duration: 100 }), 4, true),
      withTiming(0, { duration: 50 }),
    );
  };

  const submit = async () => {
    const e = validate(mode, { name, email, password, confirm });
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length > 0) {
      shake();
      return;
    }
    setLoading(true);
    try {
      if (isSignup) await signUp({ name: name.trim(), email: email.trim(), password });
      else await signIn({ email: email.trim(), password });
      router.replace('/(tabs)/home'); // unreachable until a real auth service exists
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const enter = (delay: number) => (reduce ? undefined : FadeInDown.delay(delay).duration(450));

  return (
    <Screen edges={['top', 'bottom']} style={{ backgroundColor: bg }}>
      <Backdrop bg={bg} accent={accent} reduce={reduce} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            padding: SPACING.xl,
            gap: SPACING.lg,
            justifyContent: 'center',
            maxWidth: 480,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          {/* Brand */}
          <Animated.View entering={enter(0)} style={{ alignItems: 'center', gap: SPACING.sm }}>
            <LogoMark size={60} />
            <Wordmark size={24} />
            <AppText muted variant="caption" style={{ letterSpacing: 2.5, textTransform: 'uppercase' }}>
              {BRAND.tagline}
            </AppText>
          </Animated.View>

          <Animated.View entering={enter(80)}>
            <ModeSwitch mode={mode} accent={accent} onChange={(m) => router.replace(m === 'login' ? '/login' : '/signup')} />
          </Animated.View>

          {/* Form card */}
          <Animated.View entering={enter(160)} style={shakeStyle}>
            <View
              style={{
                gap: SPACING.md,
                padding: SPACING.xl,
                borderRadius: 28,
                backgroundColor: withAlpha(c.surface, 0.78),
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.09)',
              }}
            >
              <View style={{ gap: 4, marginBottom: SPACING.xs }}>
                <AppText variant="title" accessibilityRole="header">
                  {isSignup ? 'Create your account' : 'Welcome back'}
                </AppText>
                <AppText muted variant="caption">
                  {isSignup ? 'Build your watchlist and discover your Taste DNA.' : 'Sign in to pick up right where you left off.'}
                </AppText>
              </View>

              {isSignup ? (
                <Field
                  label="Name"
                  icon="person-outline"
                  value={name}
                  onChangeText={setName}
                  error={errors.name}
                  autoComplete="name"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              ) : null}
              <Field
                label="Email"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoComplete="email"
                inputRef={emailRef}
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
              />
              <Field
                label="Password"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secure
                autoComplete={isSignup ? 'new-password' : 'password'}
                inputRef={passRef}
                returnKeyType={isSignup ? 'next' : 'done'}
                onSubmitEditing={isSignup ? () => confirmRef.current?.focus() : submit}
              />
              {isSignup ? <StrengthMeter password={password} /> : null}
              {isSignup ? (
                <Field
                  label="Confirm password"
                  icon="shield-checkmark-outline"
                  value={confirm}
                  onChangeText={setConfirm}
                  error={errors.confirm}
                  secure
                  autoComplete="new-password"
                  inputRef={confirmRef}
                  returnKeyType="done"
                  onSubmitEditing={submit}
                />
              ) : null}

              {formError ? (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  accessibilityLiveRegion="assertive"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: SPACING.sm,
                    padding: SPACING.md,
                    borderRadius: RADII.md,
                    borderWidth: 1,
                    borderColor: danger,
                    backgroundColor: withAlpha(danger, 0.1),
                  }}
                >
                  <Ionicons name="alert-circle" size={18} color={danger} />
                  <AppText color={danger} style={{ flex: 1 }}>{formError}</AppText>
                </Animated.View>
              ) : null}

              <View style={{ marginTop: SPACING.xs }}>
                <AppButton label={isSignup ? 'Create account' : 'Sign in'} loading={loading} onPress={submit} />
              </View>
            </View>
          </Animated.View>

          {/* Divider + guest */}
          <Animated.View entering={enter(260)} style={{ gap: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.18)' }} />
              <AppText muted variant="caption">or</AppText>
              <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.18)' }} />
            </View>
            <AppButton label="Continue as guest" variant="ghost" onPress={() => router.replace('/(tabs)/home')} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}