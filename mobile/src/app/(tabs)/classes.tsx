import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Async, Button, Card, Empty, Pill, Screen, SectionTitle } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { brand } from '@/lib/brand';
import { canJoinNow, dateTime, minutes } from '@/lib/format';
import { joinClass } from '@/lib/notify';
import type { ClassSession } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const TYPE_LABEL = { live: 'Live class', webinar: 'Webinar', mentorship: 'Mentorship' } as const;

export default function Classes() {
  const { session } = useAuth();
  const { data, error, loading, reload } = useApi<ClassSession[]>('/my/schedule');
  const [joining, setJoining] = useState<number | null>(null);

  const upcoming = (data ?? []).filter((s) => s.status === 'live' || s.status === 'scheduled');
  const past = (data ?? []).filter((s) => s.status === 'completed' || s.status === 'cancelled').reverse();

  return (
    <Screen title="My classes" subtitle="All times are Indian time. You can join 10 minutes before a class starts." onRefresh={reload}>
      <Async loading={loading} error={error} onRetry={reload}>
        <SectionTitle>Coming up</SectionTitle>
        {upcoming.length === 0 ? <Empty icon="calendar-outline" title="No classes coming up" detail="New classes will show here." /> : null}
        {upcoming.map((s) => (
          <Card key={s.id}>
            <Pill label={s.status === 'live' ? 'Live now' : TYPE_LABEL[s.type]} tone={s.status === 'live' ? 'live' : 'neutral'} />
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.meta}>
              {s.coach?.name ?? 'Redbean'} · {dateTime(s.startsAt)}
            </Text>
            <Text style={styles.meta}>{minutes((new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) / 1000)} long</Text>
            {canJoinNow(s.startsAt, s.endsAt) ? (
              <View style={{ marginTop: 6 }}>
                <Button
                  label="Join class"
                  icon="videocam"
                  busy={joining === s.id}
                  onPress={async () => {
                    setJoining(s.id);
                    await joinClass(s, session?.token);
                    setJoining(null);
                  }}
                />
              </View>
            ) : null}
          </Card>
        ))}

        {past.length ? <SectionTitle>Finished</SectionTitle> : null}
        {past.slice(0, 20).map((s) => (
          <Card key={s.id}>
            <Pill label={s.status === 'cancelled' ? 'Cancelled' : s.attended ? 'You attended' : 'You missed this'} tone={s.status === 'cancelled' ? 'neutral' : s.attended ? 'good' : 'bad'} />
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.meta}>{dateTime(s.startsAt)}</Text>
            {s.recordingAvailable ? <Text style={styles.rec}>Recording is ready</Text> : null}
          </Card>
        ))}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 19, lineHeight: 25, fontWeight: '800', color: brand.ink, marginTop: 2 },
  meta: { fontSize: 15.5, color: brand.muted },
  rec: { fontSize: 15, color: brand.redDark, fontWeight: '700' },
});
