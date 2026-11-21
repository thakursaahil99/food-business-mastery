import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Async, Card, Empty, Pill, Screen, SectionTitle } from '@/components/ui';
import { brand } from '@/lib/brand';
import { dateTime } from '@/lib/format';
import type { Assignment } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function Homework() {
  const { data, error, loading, reload } = useApi<Assignment[]>('/my/assignments');
  const list = data ?? [];
  const todo = list.filter((a) => !a.submission);
  const sent = list.filter((a) => a.submission && a.submission.score === null);
  const checked = list.filter((a) => a.submission && a.submission.score !== null);
  const scored = checked.filter((a) => a.submission && a.maxScore > 0);
  const avg = scored.length ? Math.round(scored.reduce((s, a) => s + ((a.submission?.score ?? 0) / a.maxScore) * 100, 0) / scored.length) : null;

  const card = (a: Assignment) => {
    const late = !a.submission && new Date(a.dueAt).getTime() < Date.now();
    return (
      <Card key={a.id} onPress={() => router.push(`/assignment/${a.id}`)}>
        {a.submission ? (
          a.submission.score !== null ? <Pill label={`${a.submission.score} out of ${a.maxScore} marks`} tone="good" /> : <Pill label="Sent. Waiting for marks" tone="warn" />
        ) : (
          <Pill label={late ? 'Time is over' : 'To do'} tone={late ? 'bad' : 'neutral'} />
        )}
        <Text style={styles.title}>{a.title}</Text>
        <Text style={styles.meta}>
          {a.moduleTitle ? `${a.moduleTitle} · ` : ''}Last date {dateTime(a.dueAt)}
        </Text>
      </Card>
    );
  };

  return (
    <Screen title="Homework" subtitle="Small tasks after each topic. Your coach checks them and gives marks." onRefresh={reload}>
      <Async loading={loading} error={error} onRetry={reload}>
        {avg !== null ? (
          <Card dark>
            <Text style={styles.darkLabel}>Your average marks</Text>
            <Text style={styles.darkValue}>{avg}%</Text>
          </Card>
        ) : null}
        {list.length === 0 ? <Empty icon="document-text-outline" title="No homework yet" detail="New tasks will show here." /> : null}
        {todo.length ? <SectionTitle>To do</SectionTitle> : null}
        {todo.map(card)}
        {sent.length ? <SectionTitle>Sent</SectionTitle> : null}
        {sent.map(card)}
        {checked.length ? <SectionTitle>Checked</SectionTitle> : null}
        {checked.map(card)}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: brand.ink, marginTop: 2 },
  meta: { fontSize: 15, color: brand.muted },
  darkLabel: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  darkValue: { fontSize: 34, fontWeight: '800', color: '#fff' },
});
