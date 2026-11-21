import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Async, Bar, Empty, Pill, Screen, SectionTitle } from '@/components/ui';
import { assetUrl } from '@/lib/assets';
import { brand } from '@/lib/brand';
import type { Enrollment, ProgramModule } from '@/lib/types';
import { useApi } from '@/lib/use-api';

/** A course as the app shows it: the cohort program first, then the self-paced short courses. */
interface CourseSummary {
  slug: string;
  title: string;
  tagline: string;
  cover: string | null;
  level: string;
  kind: 'program' | 'short';
  coach: string | null;
  modules: ProgramModule[];
  /** Program only: "Week 7 of 16" */
  weekLine?: string;
}

interface ApiCourse {
  slug: string;
  title: string;
  tagline: string;
  cover: string | null;
  level: string;
  coach: { name: string } | null;
  modules: ProgramModule[];
}

export default function Learn() {
  const enrollments = useApi<Enrollment[]>('/my/enrollments');
  const e = enrollments.data?.[0];
  const programModules = useApi<ProgramModule[]>(e ? `/programs/${e.program.slug}/modules` : null);
  const short = useApi<ApiCourse[]>('/my/courses?kind=short');

  const loading = enrollments.loading || short.loading || (!!e && programModules.loading);
  const error = enrollments.error ?? short.error ?? programModules.error;
  const reload = async () => {
    await Promise.all([enrollments.reload(), short.reload(), programModules.reload()]);
  };

  const mine: CourseSummary[] = e
    ? [
        {
          slug: e.program.slug,
          title: e.program.title,
          tagline: 'Your 16 week cohort program. New recordings open with the live classes.',
          cover: '/photos/community-group.webp',
          level: 'Advanced',
          kind: 'program',
          coach: e.batch.coach?.name ?? null,
          modules: programModules.data ?? [],
          weekLine: `Week ${e.currentWeek} of ${e.program.durationWeeks}`,
        },
      ]
    : [];
  const more: CourseSummary[] = (short.data ?? []).map((c) => ({
    slug: c.slug,
    title: c.title,
    tagline: c.tagline,
    cover: c.cover,
    level: c.level,
    kind: 'short',
    coach: c.coach?.name ?? null,
    modules: c.modules,
  }));

  return (
    <Screen title="My courses" subtitle="Pick a course and watch it one lesson at a time." onRefresh={reload}>
      <Async loading={loading} error={error} onRetry={reload}>
        {mine.length + more.length === 0 ? <Empty icon="school-outline" title="No courses yet" detail="Your courses will appear here." /> : null}
        {mine.length ? <SectionTitle>Your program</SectionTitle> : null}
        {mine.map((c) => (
          <CourseCard key={c.slug} course={c} />
        ))}
        {more.length ? <SectionTitle>More courses to learn at your own pace</SectionTitle> : null}
        {more.map((c) => (
          <CourseCard key={c.slug} course={c} />
        ))}
      </Async>
    </Screen>
  );
}

function CourseCard({ course: c }: { course: CourseSummary }) {
  const lessons = c.modules.flatMap((m) => m.lessons);
  const done = lessons.filter((l) => l.completed).length;
  const url = assetUrl(c.cover);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open course ${c.title}`}
      onPress={() => router.push(`/course/${c.slug}?title=${encodeURIComponent(c.title)}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.cover}>
        {url ? <Image source={{ uri: url }} contentFit="cover" style={StyleSheet.absoluteFill} transition={200} /> : null}
        <View style={styles.coverWash} />
        <View style={styles.coverTop}>
          <Pill label={c.level} />
          {c.kind === 'program' ? <Pill label="Your cohort" tone="live" /> : null}
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{c.title}</Text>
        <Text style={styles.tagline}>{c.tagline}</Text>
        {c.coach ? <Text style={styles.meta}>With {c.coach}</Text> : null}
        {lessons.length ? (
          <View style={{ gap: 6, marginTop: 4 }}>
            <Bar pct={(done / lessons.length) * 100} />
            <Text style={styles.meta}>
              {c.weekLine ? `${c.weekLine} · ` : ''}
              {done} of {lessons.length} lessons done
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: brand.line, overflow: 'hidden' },
  cover: { height: 130, backgroundColor: brand.ink, justifyContent: 'flex-end' },
  coverWash: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(7,7,10,0.25)' },
  coverTop: { flexDirection: 'row', gap: 8, padding: 12 },
  body: { padding: 16, gap: 4 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: brand.ink },
  tagline: { fontSize: 15.5, lineHeight: 22, color: brand.muted },
  meta: { fontSize: 14.5, color: brand.muted },
});
