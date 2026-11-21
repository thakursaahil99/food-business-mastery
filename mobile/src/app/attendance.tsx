import { Icon, type IconName } from '@/components/icon';
import { StyleSheet, Text, View } from 'react-native';

import { Async, Bar, Card, Empty, Screen, SectionTitle, Stat } from '@/components/ui';
import { brand } from '@/lib/brand';
import { dateTime, minutes } from '@/lib/format';
import type { ClassSession, Enrollment } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function Attendance() {
  const schedule = useApi<ClassSession[]>('/my/schedule');
  const enrollments = useApi<Enrollment[]>('/my/enrollments');
  const reload = async () => {
    await Promise.all([schedule.reload(), enrollments.reload()]);
  };

  const held = (schedule.data ?? []).filter((s) => s.status === 'completed').reverse();
  const present = held.filter((s) => s.attended).length;
  const missed = held.length - present;
  const upcoming = (schedule.data ?? []).filter((s) => s.status === 'scheduled' || s.status === 'live').length;
  const pct = enrollments.data?.[0]?.attendancePct ?? (held.length ? Math.round((present / held.length) * 100) : 0);
  const secs = held.reduce((n, s) => n + (s.attendedSec ?? 0), 0);

  return (
    <Screen title="My attendance" subtitle="Marked on its own when you join a class." back onRefresh={reload}>
      <Async loading={schedule.loading || enrollments.loading} error={schedule.error ?? enrollments.error} onRetry={reload}>
        <Card dark style={{ gap: 12 }}>
          <Text style={styles.big}>{pct}% attended</Text>
          <Bar pct={pct} tone="light" />
          <View style={styles.stats}>
            <Stat dark label="Present" value={String(present)} />
            <Stat dark label="Missed" value={String(missed)} />
            <Stat dark label="Coming up" value={String(upcoming)} />
          </View>
          {secs > 0 ? <Text style={styles.sub}>{minutes(secs)} spent in class</Text> : null}
        </Card>

        <SectionTitle>Past classes</SectionTitle>
        {held.length === 0 ? <Empty icon="calendar-outline" title="No classes yet" /> : null}
        {held.map((s) => (
          <Card key={s.id} style={styles.line}>
            <View style={[styles.badge, { backgroundColor: s.attended ? '#dcfce7' : '#fee2e2' }]}>
              <Icon name={s.attended ? 'checkmark' : 'close'} size={20} color={s.attended ? '#166534' : '#991b1b'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.meta}>
                {dateTime(s.startsAt)} · {s.attended ? 'Present' : 'Missed'}
              </Text>
            </View>
          </Card>
        ))}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { fontSize: 30, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  stats: { flexDirection: 'row', gap: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, lineHeight: 23, fontWeight: '700', color: brand.ink },
  meta: { fontSize: 14.5, color: brand.muted },
});
