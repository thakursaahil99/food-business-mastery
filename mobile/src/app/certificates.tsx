import { Image } from 'expo-image';
import { Linking, Share, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Async, Bar, Button, Card, Empty, Pill, Screen, SectionTitle } from '@/components/ui';
import { brand } from '@/lib/brand';
import { day } from '@/lib/format';
import { notify } from '@/lib/notify';
import type { CertificateEntry, CertificateStep } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function Certificates() {
  const { data, error, loading, reload } = useApi<CertificateEntry[]>('/my/certificates');
  const list = data ?? [];
  const earned = list.filter((c) => c.status === 'earned');
  const pending = list.filter((c) => c.status !== 'earned');

  return (
    <Screen title="My certificates" subtitle="Finish a course to get a Redbean certificate. Anyone can check it with the QR code on it." back onRefresh={reload}>
      <Async loading={loading} error={error} onRetry={reload}>
        {list.length === 0 ? <Empty icon="ribbon-outline" title="No courses yet" detail="Your certificates will show here." /> : null}

        {earned.length ? <SectionTitle>Your certificates</SectionTitle> : null}
        {earned.map((c) => (
          <EarnedCard key={c.course.slug} entry={c} />
        ))}

        {pending.length ? <SectionTitle>Still to finish</SectionTitle> : null}
        {pending.map((c) => (
          <PendingCard key={c.course.slug} entry={c} />
        ))}
      </Async>
    </Screen>
  );
}

/** A small picture of the real certificate, then Open and Share. */
function EarnedCard({ entry }: { entry: CertificateEntry }) {
  const cert = entry.certificate!;
  const open = () => Linking.openURL(cert.url).catch(() => notify('Cannot open', 'Please try again.'));
  const share = async () => {
    try {
      await Share.share({ message: `My Redbean Academy certificate for ${cert.courseTitle}. Check it here: ${cert.url}`, url: cert.url });
    } catch {
      notify('Cannot share', 'Please try again.');
    }
  };

  return (
    <Card style={{ gap: 14 }}>
      <View style={styles.paper} accessibilityLabel={`Certificate for ${cert.courseTitle}`}>
        <View style={styles.frame}>
          <View style={styles.inner}>
            <Image source={require('../../assets/brand/redbean-logo.png')} contentFit="contain" style={styles.logo} />
            <Text style={styles.kicker}>CERTIFICATE OF COMPLETION</Text>
            <Text style={styles.name} numberOfLines={2}>
              {cert.studentName}
            </Text>
            <Text style={styles.course} numberOfLines={2}>
              {cert.courseTitle}
            </Text>
            <Text style={styles.small}>
              {entry.course.batchName ? `${entry.course.batchName} · ` : ''}Issued {day(cert.issuedAt)}
            </Text>
            <Text style={styles.code}>{cert.code}</Text>
          </View>
        </View>
      </View>
      <View style={styles.row}>
        <Pill label="Earned" tone="good" />
        <Text style={styles.meta}>Code {cert.code}</Text>
      </View>
      <Button label="Open and download" icon="open-outline" onPress={open} />
      <Button label="Share" icon="share-social-outline" variant="quiet" onPress={share} />
    </Card>
  );
}

function PendingCard({ entry }: { entry: CertificateEntry }) {
  const total = entry.steps.length;
  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.row}>
        <Icon name="ribbon-outline" size={26} color={brand.red} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{entry.course.title}</Text>
          <Text style={styles.meta}>
            {entry.stepsDone} of {total} {total === 1 ? 'step' : 'steps'} done
          </Text>
        </View>
      </View>
      <Bar pct={(entry.stepsDone / total) * 100} />
      <View style={{ gap: 8 }}>
        {entry.steps.map((s) => (
          <StepRow key={s.key} step={s} />
        ))}
      </View>
    </Card>
  );
}

function StepRow({ step: s }: { step: CertificateStep }) {
  const count = s.key === 'final' ? null : s.unit === '%' ? `Now ${s.current}%` : s.total > 0 ? `${s.current} of ${s.total}` : null;
  return (
    <View style={[styles.step, s.done && styles.stepDone]}>
      <View style={[styles.dot, s.done ? styles.dotDone : styles.dotTodo]}>{s.done ? <Icon name="checkmark" size={16} color="#fff" /> : null}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepLabel, s.done && { color: '#14532d' }]}>{s.label}</Text>
        {count || s.hint ? <Text style={styles.meta}>{[count, !s.done ? s.hint : null].filter(Boolean).join(' · ')}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: { backgroundColor: brand.cream, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#ece6da' },
  frame: { borderWidth: 2, borderColor: brand.red, padding: 4 },
  inner: { borderWidth: 1, borderColor: '#b8862f', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10, gap: 4 },
  logo: { width: 64, height: 64 },
  kicker: { fontSize: 11, letterSpacing: 2, fontWeight: '800', color: '#b8862f', marginTop: 4, textAlign: 'center' },
  name: { fontSize: 24, fontStyle: 'italic', fontWeight: '700', color: brand.redDark, textAlign: 'center', marginTop: 4, fontFamily: 'serif' },
  course: { fontSize: 16, fontWeight: '800', color: brand.ink, textAlign: 'center' },
  small: { fontSize: 13, color: brand.muted, textAlign: 'center' },
  code: { fontSize: 12, letterSpacing: 1, color: brand.muted, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: brand.ink },
  meta: { fontSize: 14.5, color: brand.muted },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: '#f6f3ee' },
  stepDone: { backgroundColor: '#f0fdf4' },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: '#16a34a' },
  dotTodo: { borderWidth: 2, borderColor: '#cfcbc2' },
  stepLabel: { fontSize: 16.5, fontWeight: '700', color: brand.ink },
});
