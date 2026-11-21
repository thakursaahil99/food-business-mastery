import { Icon, type IconName } from '@/components/icon';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, parseIdentifier } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brand } from '@/lib/brand';
import { storage } from '@/lib/storage';

const LAST_KEY = 'rb_last_identifier';
const RESEND_SECONDS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Faded Redbean beans in the corners, like the web login. Decorative only. */
const BEANS = [
  { top: 380, left: -26, size: 96, rotate: '-28deg', opacity: 0.07 },
  { top: 520, right: -34, size: 150, rotate: '14deg', opacity: 0.06 },
  { bottom: 90, left: -18, size: 110, rotate: '-12deg', opacity: 0.06 },
  { bottom: 30, right: 40, size: 70, rotate: '-35deg', opacity: 0.08 },
] as const;

/** Login and register in one screen: details, then the 6 digit code. Same look as the web login. */
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { requestOtp, verifyOtp } = useAuth();
  const isRegister = mode === 'register';

  const [step, setStep] = useState<'identify' | 'verify'>('identify');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [remember, setRemember] = useState(true);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const parsed = parseIdentifier(identifier);
  const isPhone = parsed?.kind === 'phone';
  const valid = isRegister ? name.trim().length >= 2 && EMAIL_RE.test(email.trim()) && isPhone : !!parsed;
  const registerInfo = isRegister ? { name: name.trim(), email: email.trim().toLowerCase() } : undefined;

  useEffect(() => {
    if (isRegister) return;
    storage.get(LAST_KEY).then((v) => v && setIdentifier(v));
  }, [isRegister]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function send() {
    if (!parsed || !valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await requestOtp(parsed.value, registerInfo);
      if (!isRegister) await (remember ? storage.set(LAST_KEY, identifier.trim()) : storage.remove(LAST_KEY));
      setCode('');
      setResendIn(RESEND_SECONDS);
      setStep('verify');
    } catch (e) {
      setError(friendly(e, 'send'));
    } finally {
      setBusy(false);
    }
  }

  async function verify(c: string) {
    if (!parsed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(parsed.value, c, { register: registerInfo, remember });
      // The router moves to the app by itself once the session is set.
    } catch (e) {
      setError(friendly(e, 'verify'));
      setCode('');
      setBusy(false);
    }
  }

  const onCode = (v: string) => {
    const c = v.replace(/\D/g, '').slice(0, 6);
    setCode(c);
    setError(null);
    if (c.length === 6) void verify(c);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {BEANS.map((b, i) => (
        <Image key={i} source={require('../../assets/brand/redbean-mark.png')} contentFit="contain" style={[styles.bean, { width: b.size, height: b.size, opacity: b.opacity, transform: [{ rotate: b.rotate }] }, b]} />
      ))}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.column}>
            <Banner />

            {step === 'identify' ? (
              <View style={styles.form}>
                <Text style={styles.h1} accessibilityRole="header">
                  {isRegister ? 'Create your account' : 'Welcome back'}
                </Text>
                <Text style={styles.sub}>{isRegister ? 'Join Redbean Academy. We will verify your WhatsApp number.' : 'Sign in with your email or WhatsApp number'}</Text>

                <View style={{ gap: 14, marginTop: 20 }}>
                  {isRegister ? (
                    <>
                      <IconField label="Full name" icon="person-outline" value={name} onChangeText={(v) => { setName(v); setError(null); }} placeholder="Your full name" autoComplete="name" />
                      <IconField label="Email" icon="mail-outline" value={email} onChangeText={(v) => { setEmail(v); setError(null); }} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
                    </>
                  ) : null}
                  <IconField
                    label={isRegister ? 'WhatsApp number' : 'Email or WhatsApp number'}
                    icon={isPhone || isRegister ? 'call-outline' : 'mail-outline'}
                    value={identifier}
                    onChangeText={(v) => { setIdentifier(v); setError(null); }}
                    placeholder={isRegister ? '98765 43210' : 'you@example.com or 98765 43210'}
                    autoCapitalize="none"
                    keyboardType={isRegister ? 'phone-pad' : 'email-address'}
                    autoComplete={isRegister ? 'tel' : 'username'}
                    error={!!error}
                    badge={parsed ? (isPhone ? 'WhatsApp' : 'Email') : undefined}
                    onSubmitEditing={send}
                  />
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: remember }} onPress={() => setRemember((r) => !r)} style={styles.remember}>
                  <View style={[styles.check, remember && styles.checkOn]}>{remember ? <Icon name="checkmark" size={14} color="#fff" /> : null}</View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </Pressable>

                <PrimaryButton label={isRegister ? 'Send code' : 'Continue with OTP'} busy={busy} disabled={!valid} onPress={send} />

                <View style={styles.note}>
                  <Icon name="lock-closed-outline" size={14} color="#8b8b95" />
                  <Text style={styles.noteText}>No password needed. We will send a one-time code.</Text>
                </View>

                <View style={styles.divider} />
                <Text style={styles.switch}>
                  {isRegister ? 'Already have an account? ' : 'New to Redbean? '}
                  <Link href={isRegister ? '/login' : '/register'} style={styles.link}>
                    {isRegister ? 'Sign in' : 'Create an account'}
                  </Link>
                </Text>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.h1} accessibilityRole="header">
                  Enter the code
                </Text>
                <Text style={styles.sub}>
                  We sent a 6 digit code to {isPhone ? 'your WhatsApp' : 'your email'} {mask(parsed?.value ?? '')}
                </Text>

                <CodeBoxes code={code} onChange={onCode} error={!!error} />
                {__DEV__ ? <Text style={styles.devHint}>Demo mode: the code is 123456 for student accounts.</Text> : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={{ height: 8 }} />
                <PrimaryButton label="Verify and sign in" busy={busy} disabled={code.length !== 6} onPress={() => verify(code)} />

                <Pressable accessibilityRole="button" disabled={resendIn > 0 || busy} onPress={send} style={styles.textButton}>
                  <Text style={[styles.link, resendIn > 0 && { color: '#9a9aa3' }]}>{resendIn > 0 ? `Send the code again in ${resendIn}s` : 'Send the code again'}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setStep('identify');
                    setCode('');
                    setError(null);
                  }}
                  style={styles.textButton}
                >
                  <Text style={styles.plainLink}>Use a different {isRegister || isPhone ? 'number' : 'email'}</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.terms}>By continuing you agree to the Redbean Academy terms and privacy policy.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Flagship course banner on a photo with the red wash, as on the web login for phones. */
function Banner() {
  return (
    <ImageBackground source={require('../../assets/brand/community-group.webp')} style={styles.banner} imageStyle={{ borderRadius: 24 }} resizeMode="cover">
      <View style={styles.bannerWash} />
      <Image source={require('../../assets/brand/redbean-logo-white.png')} contentFit="contain" style={styles.logo} accessibilityLabel="Red Bean Hospitality" />
      <View style={{ gap: 2 }}>
        <Text style={styles.bannerKicker}>FLAGSHIP COURSE</Text>
        <Text style={styles.bannerTitle}>CGR Mastery Program</Text>
        <Text style={styles.bannerMeta}>4 months · Live classes · Mentorship</Text>
      </View>
    </ImageBackground>
  );
}

function IconField({ label, icon, badge, error, ...props }: TextInputProps & { label: string; icon: IconName; badge?: string; error?: boolean }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focus && styles.fieldFocus, error && styles.fieldError]}>
        <Icon name={icon} size={20} color={focus || error ? brand.red : '#8b8b95'} />
        <TextInput
          placeholderTextColor="#a2a2ab"
          {...props}
          onFocus={(e) => {
            setFocus(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            props.onBlur?.(e);
          }}
          style={styles.fieldInput}
        />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Six boxes backed by one invisible input, so paste and SMS autofill just work. */
function CodeBoxes({ code, onChange, error }: { code: string; onChange: (v: string) => void; error: boolean }) {
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Enter the 6 digit code" style={styles.boxes}>
      {Array.from({ length: 6 }, (_, i) => {
        const active = i === Math.min(code.length, 5);
        return (
          <View key={i} style={[styles.box, active && styles.boxActive, error && styles.fieldError]}>
            <Text style={styles.boxText}>{code[i] ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={code}
        onChangeText={onChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        caretHidden
        autoFocus
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

function PrimaryButton({ label, busy, disabled, onPress }: { label: string; busy?: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [styles.primary, (disabled || busy) && { opacity: 0.45 }, pressed && { opacity: 0.85 }]}>
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}
      {!busy ? <Icon name="arrow-forward" size={18} color="#fff" /> : null}
    </Pressable>
  );
}

function mask(v: string) {
  if (v.includes('@')) {
    const [u, d] = v.split('@');
    return `${u.slice(0, 2)}${'•'.repeat(Math.max(1, u.length - 2))}@${d}`;
  }
  return `${v.slice(0, 3)} ${v.slice(3, 5)}••• ••${v.slice(-3)}`;
}

function friendly(e: unknown, phase: 'send' | 'verify') {
  if (e instanceof ApiError) {
    if (e.status === 404) return 'No account found. Please create an account first.';
    if (e.status === 409) return 'An account already exists. Please sign in.';
    if (e.status === 429) return phase === 'verify' ? 'Too many wrong tries. Ask for a new code.' : 'Please wait a little before asking for another code.';
    if (phase === 'verify' && (e.status === 422 || e.status === 400)) return 'That code is not right or has expired.';
    if (e.fieldErrors) return Object.values(e.fieldErrors)[0]?.[0] ?? e.message;
    return e.message;
  }
  return 'Something went wrong. Please try again.';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  bean: { position: 'absolute' },
  scroll: { flexGrow: 1, alignItems: 'center' },
  column: { width: '100%', maxWidth: 460, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 6 },
  banner: { height: 176, borderRadius: 24, overflow: 'hidden', justifyContent: 'space-between', padding: 18 },
  bannerWash: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(122,12,24,0.8)', borderRadius: 24 },
  logo: { width: 112, height: 56 },
  bannerKicker: { color: '#ff7a86', fontSize: 11.5, fontWeight: '800', letterSpacing: 1.6 },
  bannerTitle: { color: '#fff', fontSize: 23, fontWeight: '800' },
  bannerMeta: { color: 'rgba(255,255,255,0.78)', fontSize: 13.5 },
  form: { marginTop: 22 },
  h1: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: brand.ink, letterSpacing: -0.6 },
  sub: { fontSize: 16.5, lineHeight: 24, color: '#6b6b76', marginTop: 6 },
  label: { fontSize: 15, fontWeight: '700', color: brand.ink },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, borderRadius: 16, borderWidth: 1.5, borderColor: '#e4e1da', backgroundColor: '#fff', paddingHorizontal: 14 },
  fieldFocus: { borderColor: brand.red },
  fieldError: { borderColor: brand.red, backgroundColor: '#fff8f8' },
  fieldInput: { flex: 1, fontSize: 17, color: brand.ink, paddingVertical: 12, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) },
  badge: { backgroundColor: brand.redTint, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { color: brand.redDark, fontSize: 12, fontWeight: '800' },
  error: { color: brand.redDark, fontSize: 15, marginTop: 10 },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, marginTop: 8, alignSelf: 'flex-start' },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cfcbc2', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: brand.red, borderColor: brand.red },
  rememberText: { fontSize: 16, color: '#3f3f46' },
  primary: { flexDirection: 'row', gap: 8, minHeight: 56, borderRadius: 28, backgroundColor: brand.red, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  primaryText: { color: '#fff', fontSize: 17.5, fontWeight: '700' },
  note: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  noteText: { fontSize: 13.5, color: '#8b8b95' },
  divider: { height: 1, backgroundColor: '#eeece8', marginTop: 22, marginBottom: 16 },
  switch: { textAlign: 'center', fontSize: 16, color: '#6b6b76' },
  link: { color: brand.red, fontWeight: '700', fontSize: 16 },
  plainLink: { color: '#3f3f46', fontWeight: '600', fontSize: 16 },
  textButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  terms: { textAlign: 'center', fontSize: 12.5, lineHeight: 18, color: '#9a9aa3', marginTop: 22, paddingHorizontal: 16 },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 24 },
  box: { flex: 1, aspectRatio: 0.85, maxWidth: 62, borderRadius: 14, borderWidth: 1.5, borderColor: '#e4e1da', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  boxActive: { borderColor: brand.red, borderWidth: 2 },
  boxText: { fontSize: 26, fontWeight: '800', color: brand.ink },
  hiddenInput: { position: 'absolute', opacity: 0.01, width: '100%', height: '100%' },
  devHint: { fontSize: 14, color: '#6b6b76', marginTop: 12 },
});
