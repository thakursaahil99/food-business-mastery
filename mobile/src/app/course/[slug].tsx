import { Icon, type IconName } from '@/components/icon';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Async, Bar, Card, Empty, Pill, Screen } from '@/components/ui';
import { brand } from '@/lib/brand';
import { minutes } from '@/lib/format';
import { notify } from '@/lib/notify';
import type { Lesson, ProgramModule } from '@/lib/types';
import { useApi } from '@/lib/use-api';

/** One course: its parts and lessons with what is done, locked or waiting. */
export default function CourseScreen() {
  const { slug, title } = useLocalSearchParams<{ slug: string; title?: string }>();
  const modules = useApi<ProgramModule[]>(`/programs/${slug}/modules`);
  const list = modules.data ?? [];
  const all = list.flatMap((m) => m.lessons);
  const done = all.filter((l) => l.completed).length;

  function open(l: Lesson) {
    if (l.locked) return notify('Not open yet', 'This lesson opens in a later week. Keep going with the ones before it.');
    if (l.type === 'pdf') return notify('Reading material', 'The notes for this lesson will be sent to your WhatsApp.');
    router.push(`/lesson/${l.id}?title=${encodeURIComponent(l.title)}`);
  }

  return (
    <Screen title={title ?? 'Course'} subtitle={all.length ? `You have finished ${done} of ${all.length} lessons` : undefined} back onRefresh={modules.reload}>
      <Async loading={modules.loading} error={modules.error} onRetry={modules.reload}>
        {all.length ? <Bar pct={(done / all.length) * 100} /> : null}
        {list.length === 0 ? <Empty icon="school-outline" title="No lessons yet" /> : null}
        {list.map((m) => (
          <Card key={m.id} style={{ padding: 6, gap: 0 }}>
            <View style={styles.head}>
              <Text style={styles.module}>{m.title}</Text>
              {m.weekFrom !== m.weekTo || m.weekFrom > 1 ? <Text style={styles.meta}>{m.weekFrom === m.weekTo ? `Week ${m.weekFrom}` : `Weeks ${m.weekFrom} to ${m.weekTo}`}</Text> : null}
            </View>
            {m.lessons.map((l, i) => (
              <View key={l.id}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <Pressable accessibilityRole="button" onPress={() => open(l)} style={({ pressed }) => [styles.lesson, pressed && { backgroundColor: '#f6f3ee' }]}>
                  <View style={[styles.dot, l.completed && { backgroundColor: '#dcfce7' }, l.locked && { backgroundColor: '#eeece8' }]}>
                    <Icon name={l.completed ? 'checkmark' : l.locked ? 'lock-closed' : l.type === 'pdf' ? 'document-text' : 'play'} size={18} color={l.completed ? '#166534' : l.locked ? '#8b8b95' : brand.red} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.lessonTitle, l.locked && { color: brand.muted }]}>{l.title}</Text>
                    <View style={styles.meta2}>
                      {l.completed ? <Pill label="Done" tone="good" /> : l.locked ? <Pill label="Opens later" /> : l.watchedSec > 0 ? <Pill label="Started" tone="warn" /> : <Pill label="Ready" />}
                      <Text style={styles.meta}>{l.type === 'pdf' ? 'Reading' : minutes(l.durationSec)}</Text>
                    </View>
                    {!l.locked && !l.completed && l.durationSec > 0 && l.watchedSec > 0 ? <Bar pct={(l.watchedSec / l.durationSec) * 100} /> : null}
                  </View>
                </Pressable>
              </View>
            ))}
          </Card>
        ))}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6, gap: 2 },
  module: { fontSize: 19, lineHeight: 25, fontWeight: '800', color: brand.ink },
  meta: { fontSize: 14.5, color: brand.muted },
  meta2: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  lesson: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 14, minHeight: 64 },
  divider: { height: 1, backgroundColor: '#f0ede7', marginHorizontal: 12 },
  dot: { width: 38, height: 38, borderRadius: 19, backgroundColor: brand.redTint, alignItems: 'center', justifyContent: 'center' },
  lessonTitle: { fontSize: 17, lineHeight: 23, fontWeight: '700', color: brand.ink },
});
