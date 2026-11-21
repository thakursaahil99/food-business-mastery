import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Async, Button, Card, Empty, Field, Pill, Screen, SectionTitle } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { brand } from '@/lib/brand';
import { dateTime } from '@/lib/format';
import { notify } from '@/lib/notify';
import type { Doubt, DoubtCategory } from '@/lib/types';
import { useApi, useWrite } from '@/lib/use-api';

const CATEGORIES: { value: DoubtCategory; label: string }[] = [
  { value: 'Business', label: 'My business' },
  { value: 'Live class', label: 'A class' },
  { value: 'Course content', label: 'Course video' },
  { value: 'Payments', label: 'Fees' },
  { value: 'Technical', label: 'App problem' },
];

export default function Doubts() {
  const { data, error, loading, reload } = useApi<Doubt[]>('/my/doubts');
  const write = useWrite();
  const [category, setCategory] = useState<DoubtCategory>('Business');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ subject?: string; body?: string; form?: string }>({});

  async function send() {
    const next: typeof err = {};
    if (subject.trim().length < 5) next.subject = 'Add a short subject (at least 5 letters).';
    if (body.trim().length < 10) next.body = 'Write your question in a little more detail.';
    setErr(next);
    if (next.subject || next.body) return;
    setBusy(true);
    try {
      await write('/my/doubts', 'POST', { category, subject: subject.trim(), body: body.trim(), sessionTitle: null });
      setSubject('');
      setBody('');
      await reload();
      notify('Question sent', 'MD Sir or a coach will answer you here.');
    } catch (e) {
      setErr({ form: e instanceof ApiError ? e.message : 'Could not send. Please try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Ask a question" subtitle="Ask MD Sir or the coaches anything about classes, the course or your business." back keyboard onRefresh={reload}>
      <Card style={{ gap: 14 }}>
        <Text style={styles.label}>What is it about?</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => {
            const on = c.value === category;
            return (
              <Pressable key={c.value} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => setCategory(c.value)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && { color: '#fff' }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Field label="Subject" value={subject} onChangeText={setSubject} placeholder="For example: How do I price a hospital contract?" error={err.subject} maxLength={140} />
        <Field label="Your question" value={body} onChangeText={setBody} multiline placeholder="Write it here…" error={err.body} />
        {err.form ? <Text style={styles.formError}>{err.form}</Text> : null}
        <Button label="Send question" icon="send" busy={busy} onPress={send} />
      </Card>

      <SectionTitle>My questions</SectionTitle>
      <Async loading={loading} error={error} onRetry={reload}>
        {(data ?? []).length === 0 ? <Empty icon="chatbubbles-outline" title="No questions yet" detail="Your questions and the answers will show here." /> : null}
        {(data ?? []).map((d) => (
          <Card key={d.id}>
            <Pill label={d.status === 'answered' ? 'Answered' : 'Waiting for answer'} tone={d.status === 'answered' ? 'good' : 'warn'} />
            <Text style={styles.title}>{d.subject}</Text>
            <Text style={styles.meta}>
              {d.category} · {dateTime(d.createdAt)}
            </Text>
            <Text style={styles.body}>{d.body}</Text>
            {d.answer ? (
              <View style={styles.answer}>
                <Text style={styles.answerBy}>{d.answer.by} replied</Text>
                <Text style={styles.body}>{d.answer.body}</Text>
              </View>
            ) : null}
          </Card>
        ))}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 15.5, fontWeight: '700', color: brand.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: brand.line, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: brand.red, borderColor: brand.red },
  chipText: { fontSize: 15.5, fontWeight: '700', color: brand.ink },
  formError: { color: brand.redDark, fontSize: 15 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: brand.ink },
  meta: { fontSize: 14.5, color: brand.muted },
  body: { fontSize: 16.5, lineHeight: 24, color: brand.ink },
  answer: { marginTop: 6, padding: 12, borderRadius: 12, backgroundColor: '#f0fdf4', gap: 4 },
  answerBy: { fontSize: 14.5, fontWeight: '800', color: '#166534' },
});
