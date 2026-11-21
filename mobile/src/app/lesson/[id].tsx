import { Icon, type IconName } from '@/components/icon';
import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { Async, Button, Card, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brand } from '@/lib/brand';
import { notify } from '@/lib/notify';
import type { LessonStream } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const HEARTBEAT_MS = 8000;

export default function LessonScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const stream = useApi<LessonStream>(`/lessons/${id}/stream`);

  return (
    <Screen title={title ?? 'Lesson'} back>
      <Async loading={stream.loading} error={stream.error} onRetry={stream.reload}>
        {stream.data ? <Player lessonId={Number(id)} stream={stream.data} /> : null}
      </Async>
    </Screen>
  );
}

/**
 * Lesson player. No native controls, so the student cannot jump ahead: the bar only seeks inside
 * what was already watched, and the server enforces the same rule on the progress it records.
 */
function Player({ lessonId, stream }: { lessonId: number; stream: LessonStream }) {
  const { session } = useAuth();
  const token = session?.token;
  const duration = stream.durationSec;
  const startAt = Math.min(stream.watchedSec, Math.max(0, duration - 1));

  const player = useVideoPlayer(stream.url, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.5;
  });

  const [pos, setPos] = useState(startAt);
  const [furthest, setFurthest] = useState(startAt);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [finished, setFinished] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const barRef = useRef<ComponentRef<typeof Pressable>>(null);
  const resumed = useRef(startAt === 0);

  const posRef = useRef(startAt);
  const furthestRef = useRef(startAt);
  const sent = useRef(0);

  const sendProgress = useCallback(async () => {
    const position = Math.floor(posRef.current);
    if (!token || position <= 0 || position === sent.current) return;
    sent.current = position;
    try {
      await api(`/lessons/${lessonId}/progress`, { method: 'POST', token, body: JSON.stringify({ position }) });
    } catch {
      /* a missed heartbeat is fine, the next one carries on */
    }
  }, [lessonId, token]);

  // Resume where the student stopped.
  const resumeOnce = useCallback(() => {
    if (resumed.current) return;
    resumed.current = true;
    player.currentTime = startAt;
  }, [player, startAt]);
  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') resumeOnce();
    });
    return () => sub.remove();
  }, [player, resumeOnce]);

  useEffect(() => {
    const time = player.addListener('timeUpdate', ({ currentTime }) => {
      // Something moved the playhead past what was watched (a native gesture): put it back.
      if (currentTime > furthestRef.current + 2) {
        player.currentTime = furthestRef.current;
        return;
      }
      posRef.current = currentTime;
      setPos(currentTime);
      if (currentTime > furthestRef.current) {
        furthestRef.current = currentTime;
        setFurthest(currentTime);
      }
    });
    const state = player.addListener('playingChange', ({ isPlaying }) => {
      setPlaying(isPlaying);
      if (!isPlaying) void sendProgress();
    });
    const end = player.addListener('playToEnd', () => {
      setEnded(true);
      void sendProgress();
    });
    return () => {
      time.remove();
      state.remove();
      end.remove();
    };
  }, [player, sendProgress]);

  // Heartbeat while playing, and a last one when leaving the screen.
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => void sendProgress(), HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [playing, sendProgress]);
  useEffect(() => () => void sendProgress(), [sendProgress]);

  const toggle = () => {
    if (playing) return player.pause();
    if (ended) {
      player.currentTime = 0;
      setEnded(false);
    } else {
      resumeOnce();
    }
    player.play();
  };

  const seekTo = (seconds: number) => {
    if (!Number.isFinite(seconds)) return;
    const target = Math.max(0, Math.min(seconds, furthestRef.current));
    player.currentTime = target;
    posRef.current = target;
    setPos(target);
  };

  // Where on the bar the finger landed, measured against the bar's position on screen.
  const onBarPress = (e: GestureResponderEvent) => {
    const pageX = e.nativeEvent.pageX;
    barRef.current?.measureInWindow((x, _y, w) => {
      if (w > 0 && Number.isFinite(pageX)) seekTo(((pageX - x) / w) * duration);
    });
  };

  const pct = (s: number) => (duration > 0 ? Math.max(0, Math.min(100, (s / duration) * 100)) : 0);
  const canFinish = furthest >= duration * 0.9;

  async function finish() {
    setFinishing(true);
    try {
      posRef.current = Math.max(posRef.current, 0);
      sent.current = 0;
      await sendProgress();
      await api(`/lessons/${lessonId}/complete`, { method: 'POST', token });
      setFinished(true);
      notify('Well done', 'This lesson is marked as done.');
    } catch (e) {
      notify('Not yet', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setFinishing(false);
    }
  }

  return (
    <>
      <View style={styles.videoWrap}>
        <VideoView player={player} style={styles.video} nativeControls={false} contentFit="contain" />
      </View>

      <Card style={{ gap: 12 }}>
        <Pressable ref={barRef} accessibilityLabel="Seek bar. You can only go to places you have watched." onPress={onBarPress} style={styles.barHit}>
          <View style={styles.track}>
            <View style={[styles.watched, { width: `${pct(furthest)}%` }]} />
            <View style={[styles.played, { width: `${pct(pos)}%` }]} />
          </View>
          <View style={[styles.knob, { left: `${pct(pos)}%` }]} />
        </Pressable>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{clock(pos)}</Text>
          <Text style={styles.time}>{clock(duration)}</Text>
        </View>

        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back 10 seconds" onPress={() => seekTo(pos - 10)} style={styles.small}>
            <Icon name="play-back" size={22} color={brand.ink} />
            <Text style={styles.smallText}>10 sec</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'} onPress={toggle} style={styles.play}>
            <Icon name={playing ? 'pause' : ended ? 'refresh' : 'play'} size={34} color="#fff" />
          </Pressable>
          <View style={styles.small}>
            <Icon name="lock-closed" size={20} color={brand.muted} />
            <Text style={[styles.smallText, { color: brand.muted }]}>No skipping</Text>
          </View>
        </View>

        {startAt > 5 && !finished ? <Text style={styles.note}>You stopped at {clock(startAt)} last time. The bar above shows how far you have watched.</Text> : null}
        <Text style={styles.note}>You can only move to places you have already watched.</Text>
      </Card>

      {finished ? (
        <Card>
          <Text style={styles.done}>Lesson finished</Text>
        </Card>
      ) : (
        <>
          <Button label={canFinish ? 'Mark as done' : 'Watch most of the lesson to finish'} icon="checkmark-circle" disabled={!canFinish} busy={finishing} onPress={finish} />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  videoWrap: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#000' },
  video: { width: '100%', aspectRatio: 16 / 9 },
  barHit: { height: 36, justifyContent: 'center' },
  track: { height: 8, borderRadius: 99, backgroundColor: '#eeece8', overflow: 'hidden' },
  watched: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#f6c2c7' },
  played: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: brand.red },
  knob: { position: 'absolute', top: 8, width: 20, height: 20, marginLeft: -10, borderRadius: 10, backgroundColor: '#fff', borderWidth: 3, borderColor: brand.red },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 },
  time: { fontSize: 15, color: brand.muted, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  small: { minWidth: 76, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2 },
  smallText: { fontSize: 13.5, fontWeight: '700', color: brand.ink },
  play: { width: 72, height: 72, borderRadius: 36, backgroundColor: brand.red, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 14.5, lineHeight: 21, color: brand.muted },
  done: { fontSize: 19, fontWeight: '800', color: '#166534' },
});
