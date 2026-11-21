import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Async, Button, Card, Field, Pill, Screen, SectionTitle } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { brand } from '@/lib/brand';
import { dateTime } from '@/lib/format';
import { notify } from '@/lib/notify';
import type { Assignment } from '@/lib/types';
import { useApi, useWrite } from '@/lib/use-api';

export default function AssignmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, loading, reload } = useApi<Assignment[]>('/my/assignments');
  const write = useWrite();
  const a = data?.find((x) => x.id === Number(id));
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function submit() {
    if (text.trim().length < 10) return setFieldError('Write at least a couple of lines about your work.');
    setFieldError(null);
    setBusy(true);
    try {
      await write(`/assignments/${id}/submissions`, 'POST', { text: text.trim(), fileName: null });
      setText('');
      setEditing(false);
      await reload();
      notify('Sent', 'Your homework was sent to your coach.');
    } catch (e) {
      setFieldError(e instanceof ApiError ? (e.fieldErrors?.text?.[0] ?? e.message) : 'Could not send. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const s = a?.submission;
  const reviewed = !!s && s.score !== null;
  const showForm = a && (!s || (editing && !reviewed));

  return (
    <Screen title={a?.title ?? 'Homework'} back keyboard onRefresh={reload}>
      <Async loading={loading} error={error} onRetry={reload}>
        {!a ? (
          <Text style={styles.body}>This homework was not found.</Text>
        ) : (
          <>
            <Card>
              {a.moduleTitle ? <Pill label={a.moduleTitle} /> : null}
              <Text style={styles.body}>{a.description}</Text>
              <Text style={styles.meta}>
                Last date: {dateTime(a.dueAt)} · {a.maxScore} marks
              </Text>
            </Card>

            {s ? (
              <>
                <SectionTitle>What you sent</SectionTitle>
                <Card>
                  <Text style={styles.body}>{s.text}</Text>
                  <Text style={styles.meta}>Sent {dateTime(s.submittedAt)}</Text>
                </Card>
                {reviewed ? (
                  <Card>
                    <Pill label={`${s.score} out of ${a.maxScore} marks`} tone="good" />
                    {s.feedback ? <Text style={styles.body}>{s.feedback}</Text> : null}
                    {s.reviewedBy ? <Text style={styles.meta}>Checked by {s.reviewedBy}</Text> : null}
                  </Card>
                ) : !editing ? (
                  <Button label="Change my answer" variant="quiet" icon="create-outline" onPress={() => { setText(s.text); setEditing(true); }} />
                ) : null}
              </>
            ) : null}

            {showForm ? (
              <>
                <SectionTitle>{s ? 'Change your answer' : 'Your answer'}</SectionTitle>
                <Field label="Write what you did" value={text} onChangeText={setText} multiline placeholder="Write a few lines here…" error={fieldError} />
                <Button label="Send to coach" icon="send" busy={busy} onPress={submit} />
              </>
            ) : null}
          </>
        )}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 17, lineHeight: 25, color: brand.ink },
  meta: { fontSize: 15, color: brand.muted },
});
