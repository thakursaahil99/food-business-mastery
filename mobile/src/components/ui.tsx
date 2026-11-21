import { Icon, type IconName } from '@/components/icon';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Backdrop } from '@/components/backdrop';
import { brand } from '@/lib/brand';


/** Widest the content gets. Keeps tablets and the browser preview from stretching cards edge to edge. */
const MAX_W = 640;

/**
 * A page: title, optional back button, pull to refresh, and a centred column that scales with the screen.
 * `bottomSpace` leaves room for the tab bar on tab screens.
 */
export function Screen({
  title,
  subtitle,
  onRefresh,
  back,
  right,
  keyboard,
  children,
}: {
  title: string;
  subtitle?: string;
  onRefresh?: () => void | Promise<void>;
  back?: boolean;
  right?: ReactNode;
  keyboard?: boolean;
  children: ReactNode;
}) {
  const body = (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={false} onRefresh={() => void onRefresh()} tintColor={brand.red} /> : undefined}
    >
      <View style={styles.column}>
        {back ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.back} hitSlop={8}>
            <Icon name="chevron-back" size={22} color={brand.ink} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : null}
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {right}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={{ gap: 12 }}>{children}</View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={back ? ['top', 'bottom'] : ['top']}>
      <Backdrop />
      {keyboard ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style, dark, onPress }: { children: ReactNode; style?: ViewStyle; dark?: boolean; onPress?: () => void }) {
  const content = [styles.card, dark && styles.cardDark, style];
  if (onPress)
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [...content, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  return <View style={content}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'live' }) {
  const t = pillTones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
  icon,
  busy,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'quiet' | 'danger';
  icon?: IconName;
  busy?: boolean;
}) {
  const primary = variant === 'primary';
  const fg = primary ? '#fff' : variant === 'danger' ? brand.redDark : brand.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [styles.button, !primary && styles.buttonQuiet, pressed && { opacity: 0.85 }, (disabled || busy) && { opacity: 0.5 }]}
    >
      {busy ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={20} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** A tappable list line: icon, title, optional detail, chevron. At least 56 high for big fingers. */
export function Row({ icon, title, detail, onPress, tone }: { icon: IconName; title: string; detail?: string; onPress: () => void; tone?: 'red' }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#f6f3ee' }]}>
      <View style={[styles.rowIcon, tone === 'red' && { backgroundColor: brand.redTint }]}>
        <Icon name={icon} size={22} color={brand.red} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <Icon name="chevron-forward" size={20} color={brand.muted} />
    </Pressable>
  );
}

export function Stat({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <View style={[styles.stat, dark && { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
      <Text style={[styles.statValue, dark && { color: '#fff' }]}>{value}</Text>
      <Text style={[styles.statLabel, dark && { color: 'rgba(255,255,255,0.7)' }]}>{label}</Text>
    </View>
  );
}

export function Field({ label, error, multiline, ...props }: TextInputProps & { label: string; error?: string | null }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#9a9aa3"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
        style={[styles.input, multiline && { minHeight: 120, paddingTop: 14 }, !!error && { borderColor: brand.red }]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function ToggleRow({ title, detail, value, onChange }: { title: string; detail?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: brand.red, false: '#d4d0c8' }} thumbColor="#fff" accessibilityLabel={title} />
    </View>
  );
}

export function Empty({ icon, title, detail }: { icon: IconName; title: string; detail?: string }) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={34} color="#b9b4aa" />
      <Text style={styles.emptyTitle}>{title}</Text>
      {detail ? <Text style={styles.emptyDetail}>{detail}</Text> : null}
    </View>
  );
}

/** Spinner, an error with retry, or the content. */
export function Async({ loading, error, onRetry, children }: { loading: boolean; error: string | null; onRetry: () => void; children: ReactNode }) {
  if (loading) return <ActivityIndicator color={brand.red} size="large" style={{ marginTop: 40 }} />;
  if (error)
    return (
      <Card>
        <Text style={styles.error}>{error}</Text>
        <View style={{ height: 8 }} />
        <Button label="Try again" onPress={onRetry} variant="quiet" icon="refresh" />
      </Card>
    );
  return <>{children}</>;
}

export function Bar({ pct, tone }: { pct: number; tone?: 'light' }) {
  return (
    <View style={[styles.barTrack, tone === 'light' && { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
      <View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, pct))}%` }]} />
    </View>
  );
}

const pillTones = {
  neutral: { bg: '#eeece8', fg: '#3f3f46' },
  good: { bg: '#dcfce7', fg: '#166534' },
  warn: { bg: '#fef3c7', fg: '#92400e' },
  bad: { bg: '#fee2e2', fg: '#991b1b' },
  live: { bg: brand.red, fg: '#ffffff' },
} as const;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brand.cream },
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 32 },
  column: { width: '100%', maxWidth: MAX_W, paddingHorizontal: 16, paddingTop: 10, gap: 12 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', minHeight: 44 },
  backText: { fontSize: 17, fontWeight: '600', color: brand.ink },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flexShrink: 1, fontSize: 28, lineHeight: 34, fontWeight: '800', color: brand.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 16, lineHeight: 23, color: brand.muted, marginTop: -4 },
  section: { fontSize: 19, fontWeight: '800', color: brand.ink, marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: brand.line, padding: 16, gap: 8, shadowColor: '#07070a', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cardDark: { backgroundColor: brand.ink, borderColor: brand.ink },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  pillText: { fontSize: 13.5, fontWeight: '700' },
  button: { flexDirection: 'row', gap: 8, backgroundColor: brand.red, borderRadius: 14, minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonQuiet: { backgroundColor: '#fff', borderWidth: 1, borderColor: brand.line },
  buttonText: { fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14 },
  rowIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#f6f3ee', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 17, fontWeight: '700', color: brand.ink },
  rowDetail: { fontSize: 14.5, color: brand.muted, marginTop: 1 },
  stat: { flex: 1, backgroundColor: '#f6f3ee', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10, gap: 2 },
  statValue: { fontSize: 24, fontWeight: '800', color: brand.ink },
  statLabel: { fontSize: 13, color: brand.muted },
  fieldLabel: { fontSize: 15.5, fontWeight: '700', color: brand.ink },
  input: { backgroundColor: '#fff', borderColor: brand.line, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 52, fontSize: 17, color: brand.ink },
  error: { color: brand.redDark, fontSize: 15 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 8 },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 28 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: brand.ink },
  emptyDetail: { fontSize: 15, color: brand.muted, textAlign: 'center' },
  barTrack: { height: 8, borderRadius: 99, backgroundColor: '#eeece8', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 99, backgroundColor: brand.red },
});
