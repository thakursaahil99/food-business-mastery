import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Async, Bar, Button, Card, Pill, Row, Screen, SectionTitle, Stat } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { brand } from '@/lib/brand';
import { canJoinNow, dateTime } from '@/lib/format';
import { joinClass } from '@/lib/notify';
import type { Announcement, Assignment, ClassSession, Enrollment, ProgramModule } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function Home() {
  const { session } = useAuth();
  const enrollments = useApi<Enrollment[]>('/my/enrollments');
  const schedule = useApi<ClassSession[]>('/my/schedule');
  const news = useApi<Announcement[]>('/my/announcements');
  const homework = useApi<Assignment[]>('/my/assignments');
  const e = enrollments.data?.[0];
  const modules = useApi<ProgramModule[]>(e ? `/programs/${e.program.slug}/modules` : null);
  const [joining, setJoining] = useState(false);
  // On very small phones the word Homework does not fit a third of the card.
  const tiny = useWindowDimensions().width < 345;

  const next = schedule.data?.find((s) => s.status === 'live') ?? schedule.data?.find((s) => s.status === 'scheduled');
  const dueCount = (homework.data ?? []).filter((a) => !a.submission && new Date(a.dueAt).getTime() > Date.now()).length;
  // First unlocked lesson that is not finished: where the student carries on.
  const resume = (modules.data ?? []).flatMap((m) => m.lessons).find((l) => !l.locked && !l.completed && l.type === 'video');

  const loading = enrollments.loading || schedule.loading;
  const error = enrollments.error ?? schedule.error;
  const reload = async () => {
    await Promise.all([enrollments.reload(), schedule.reload(), news.reload(), homework.reload(), modules.reload()]);
  };
  const first = session?.user.name.split(' ')[0] ?? '';

  return (
    <Screen
      title={`Hello, ${first}`}
      subtitle={e ? `${e.program.title} · ${e.batch.name}` : 'Welcome to Redbean Academy'}
      onRefresh={reload}
      right={
        <View style={styles.avatar} accessibilityLabel="Your account">
          <Text style={styles.avatarText}>{first.slice(0, 1).toUpperCase()}</Text>
        </View>
      }
    >
      <Async loading={loading} error={error} onRetry={reload}>
        {e ? (
          <Card dark style={{ gap: 12 }}>
            <View style={styles.between}>
              <Text style={styles.heroBig}>Week {e.currentWeek}</Text>
              <Text style={styles.heroSmall}>of {e.program.durationWeeks}</Text>
            </View>
            <Bar pct={(e.currentWeek / e.program.durationWeeks) * 100} tone="light" />
            <View style={styles.stats}>
              <Stat dark label="Lessons done" value={`${e.progressPct}%`} />
              <Stat dark label="Classes attended" value={`${e.attendancePct}%`} />
              <Stat dark label={tiny ? 'Tasks to do' : 'Homework to do'} value={String(dueCount)} />
            </View>
          </Card>
        ) : (
          <Card>
            <Text style={styles.body}>You are not in a batch yet. Please contact the Redbean team.</Text>
          </Card>
        )}

        {next ? (
          <>
            <SectionTitle>{next.status === 'live' ? 'Class is on now' : 'Next class'}</SectionTitle>
            <Card>
              <Pill label={next.status === 'live' ? 'Live now' : 'Coming up'} tone={next.status === 'live' ? 'live' : 'neutral'} />
              <Text style={styles.cardTitle}>{next.title}</Text>
              <Text style={styles.body}>
                {next.coach?.name ?? 'Redbean'} · {dateTime(next.startsAt)}
              </Text>
              {canJoinNow(next.startsAt, next.endsAt) ? (
                <Button
                  label="Join class"
                  icon="videocam"
                  busy={joining}
                  onPress={async () => {
                    setJoining(true);
                    await joinClass(next, session?.token);
                    setJoining(false);
                  }}
                />
              ) : (
                <Text style={styles.hint}>You can join 10 minutes before it starts.</Text>
              )}
            </Card>
          </>
        ) : null}

        {resume ? (
          <>
            <SectionTitle>Carry on learning</SectionTitle>
            <Card onPress={() => router.push(`/lesson/${resume.id}?title=${encodeURIComponent(resume.title)}`)}>
              <Text style={styles.cardTitle}>{resume.title}</Text>
              <Text style={styles.body}>{resume.watchedSec > 0 ? 'Continue where you stopped' : 'Start this lesson'}</Text>
              {resume.durationSec > 0 && resume.watchedSec > 0 ? <Bar pct={(resume.watchedSec / resume.durationSec) * 100} /> : null}
            </Card>
          </>
        ) : null}

        <SectionTitle>Quick links</SectionTitle>
        <Card style={{ padding: 6 }}>
          <Row icon="help-circle-outline" title="Ask a question" detail="Ask MD Sir or the coaches" onPress={() => router.push('/doubts')} />
          <Row icon="calendar-outline" title="My attendance" detail="See the classes you joined" onPress={() => router.push('/attendance')} />
          <Row icon="ribbon-outline" title="My certificates" detail="Steps left and certificates earned" onPress={() => router.push('/certificates')} />
          <Row icon="wallet-outline" title="Fees" detail="Payments and what is due" onPress={() => router.push('/fees')} />
        </Card>

        {news.data?.length ? (
          <>
            <SectionTitle>Notices</SectionTitle>
            {news.data.slice(0, 3).map((a) => (
              <Card key={a.id}>
                {a.pinned ? <Pill label="Important" tone="warn" /> : null}
                <Text style={styles.cardTitle}>{a.title}</Text>
                <Text style={styles.body}>{a.body}</Text>
              </Card>
            ))}
          </>
        ) : null}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: brand.red, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 19, fontWeight: '800' },
  between: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  heroBig: { fontSize: 34, fontWeight: '800', color: '#fff' },
  heroSmall: { fontSize: 17, color: 'rgba(255,255,255,0.7)' },
  stats: { flexDirection: 'row', gap: 6 },
  body: { fontSize: 16, lineHeight: 23, color: brand.muted },
  hint: { fontSize: 15, color: brand.muted },
  cardTitle: { fontSize: 19, lineHeight: 25, fontWeight: '800', color: brand.ink },
});
