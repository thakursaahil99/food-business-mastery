"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, Hand, Loader2, MessageSquare, Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getJoinState } from "@/lib/join-window";
import { requestJoin } from "@/lib/actions/session";
import type { ClassSession } from "@/lib/types";
import { cn, durationLabel, initials } from "@/lib/utils";
import { useNow } from "./shell";
import { useT, useFmt } from "@/components/i18n";
import { Countdown, StatusBadge, TypeChip } from "./session-ui";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ClassLobby({ session, userName }: { session: ClassSession; userName: string }) {
  const { fmtDayLong, fmtTime } = useFmt();
  const { t } = useT();
  const L = t.lobby;
  const now = useNow();
  const js = now ? getJoinState(session, now) : null;
  const [cam, setCam] = useState(false);
  const [mic, setMic] = useState(false);
  const [joined, setJoined] = useState<null | "zoom" | "livekit">(null);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!cam) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => {
        setCam(false);
        toast.error("Camera permission was blocked", { description: "Allow camera access in your browser settings." });
      });
    return () => {
      cancelled = true;
    };
  }, [cam]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const join = () =>
    start(async () => {
      const res = await requestJoin(session.id);
      if (!res.ok) return void toast.error(res.error);
      if (res.data.mode === "zoom") {
        setZoomUrl(res.data.joinUrl);
        window.open(res.data.joinUrl, "_blank", "noopener");
        setJoined("zoom");
      } else if (res.data.mode === "mock") {
        setJoined(res.data.platform);
      } else {
        // mode "livekit" → mount <LiveKitRoom serverUrl={url} token={token}> here.
        setJoined("livekit");
      }
    });

  return (
    <div className="space-y-6">
      <Link href="/student/schedule" transitionTypes={["nav-back"]} className="group inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> {L.back}
      </Link>

      <AnimatePresence mode="wait">
        {joined === null ? (
          <motion.div key="lobby" exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="relative aspect-video overflow-hidden rounded-2xl bg-ink-950">
              {cam ? (
                <video ref={videoRef} autoPlay playsInline muted className="size-full -scale-x-100 object-cover" />
              ) : (
                <div className="grid size-full place-items-center">
                  <span className="relative grid size-24 place-items-center rounded-full bg-bean-600 text-3xl font-bold text-white">{initials(userName)}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16">
                <Toggle on={mic} onClick={() => setMic((m) => !m)} onIcon={Mic} offIcon={MicOff} label={L.mic} />
                <Toggle on={cam} onClick={() => setCam((c) => !c)} onIcon={Video} offIcon={VideoOff} label={L.camera} />
              </div>
              <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur">{userName}</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }} className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">
                <TypeChip type={session.type} />
                <StatusBadge session={session} now={now} />
              </div>
              <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-fg sm:text-3xl">{session.title}</h1>
              <p className="mt-2 text-sm text-fg-muted">
                {session.coach.name} · {fmtDayLong(session.startsAt)} · {fmtTime(session.startsAt)} IST · {durationLabel(session.startsAt, session.endsAt)}
              </p>
              {session.description && <p className="mt-4 rounded-2xl bg-surface-2 p-4 text-sm text-fg-muted">{session.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700">
                  <Video className="size-3.5" /> {session.platform === "zoom" ? L.zoom : L.liveRoom}
                </span>
                {session.recordingEnabled && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-bean-50 px-2.5 py-1 font-medium text-bean-700">
                    <span className="size-1.5 rounded-full bg-bean-500" /> {L.recorded}
                  </span>
                )}
              </div>

              <div className="mt-auto pt-8">
                {js?.state === "upcoming" ? (
                  <div className="rounded-2xl border border-line p-4 text-center">
                    <div className="text-sm text-fg-muted">{L.doorsOpen}</div>
                    <Countdown ms={js.opensInMs} className="mt-1 text-3xl font-bold text-fg" />
                  </div>
                ) : js?.state === "open" ? (
                  <Button size="lg" className="w-full" onClick={join} disabled={pending}>
                    {pending ? <Loader2 className="animate-spin" /> : null}
                    {pending ? L.connecting : js.live ? L.joinLive : L.enterEarly}
                  </Button>
                ) : js ? (
                  <p className="text-center text-sm text-fg-muted">{js.state === "ended" ? L.ended : L.cancelled}</p>
                ) : (
                  <div className="h-14 animate-pulse rounded-full bg-surface-2" />
                )}
                <p className="mt-3 text-center text-xs text-fg-muted">{L.attendanceAuto}</p>
              </div>
            </motion.div>
          </motion.div>
        ) : joined === "zoom" ? (
          <ZoomJoined key="zoom" url={zoomUrl} title={session.title} record={session.recordingEnabled} onBack={() => setJoined(null)} />
        ) : (
          <motion.div key="room" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EASE }} className="overflow-hidden rounded-2xl bg-ink-950 text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-sm">
              <span className="truncate font-medium">{session.title}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-bean-600 px-2.5 py-1 text-[11px] font-semibold uppercase">
                <span className="size-1.5 animate-pulse rounded-full bg-white" /> Live
              </span>
            </div>
            <div className="grid aspect-video grid-cols-3 gap-2 p-3 sm:grid-cols-4">
              {[session.coach.name, userName, "Anita K", "Prakash M", "Neha J", "Vikram T", "Sana R", "Imran Q"].map((n, i) => (
                <motion.div
                  key={n}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn("relative grid place-items-center rounded-2xl", i === 0 ? "col-span-2 row-span-2 bg-gradient-to-br from-bean-800 to-ink-800" : "bg-white/5")}
                >
                  <span className={cn("grid place-items-center rounded-full bg-white/10 font-semibold", i === 0 ? "size-20 text-2xl" : "size-10 text-xs")}>{initials(n)}</span>
                  <span className="absolute bottom-2 left-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px]">{i === 1 ? L.you : n}</span>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 border-t border-white/10 p-4">
              <Toggle on={mic} onClick={() => setMic((m) => !m)} onIcon={Mic} offIcon={MicOff} label={L.mic} />
              <Toggle on={cam} onClick={() => setCam((c) => !c)} onIcon={Video} offIcon={VideoOff} label={L.camera} />
              <RoomBtn icon={MonitorUp} label="Share screen" />
              <RoomBtn icon={Hand} label="Raise hand" />
              <RoomBtn icon={MessageSquare} label="Chat" />
              <button onClick={() => setJoined(null)} className="ml-2 grid h-11 place-items-center rounded-full bg-bean-600 px-5 hover:bg-bean-500" aria-label={L.leave}>
                <PhoneOff className="size-5" />
              </button>
            </div>
            <p className="pb-4 text-center text-xs text-white/40">Preview room · the LiveKit connection is added in the live-classes phase.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Toggle({ on, onClick, onIcon: On, offIcon: Off, label }: { on: boolean; onClick: () => void; onIcon: typeof Mic; offIcon: typeof Mic; label: string }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} aria-pressed={on} aria-label={label} className={cn("grid size-11 place-items-center rounded-full transition-colors", on ? "bg-white/15 text-white hover:bg-white/25" : "bg-bean-600 text-white hover:bg-bean-500")}>
      {on ? <On className="size-5" /> : <Off className="size-5" />}
    </motion.button>
  );
}

function RoomBtn({ icon: Icon, label }: { icon: typeof Mic; label: string }) {
  return (
    <button onClick={() => toast(`${label} connects with LiveKit`)} aria-label={label} className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
      <Icon className="size-5" />
    </button>
  );
}

function ZoomJoined({ url, title, record, onBack }: { url: string | null; title: string; record: boolean; onBack: () => void }) {
  const L = useT().t.lobby;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative overflow-hidden rounded-2xl bg-surface border border-line p-8 text-center text-fg sm:p-12">
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 14 }} className="relative mx-auto grid size-20 place-items-center rounded-2xl bg-[#0b5cff] shadow-sm">
        <Video className="size-9" />
      </motion.span>
      <h2 className="relative mt-6 text-2xl font-semibold sm:text-3xl">{url ? L.opening : L.checkedIn}</h2>
      <p className="relative mx-auto mt-2 max-w-md text-sm text-fg-muted">
        {url ? L.opened(title) : L.demo}
      </p>
      <ul className="relative mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-fg-muted">
        <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" /> {L.tip1}</li>
        <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" /> {L.tip2}</li>
        {record && <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" /> {L.tip3}</li>}
      </ul>
      <div className="relative mt-8 flex flex-wrap justify-center gap-2">
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink-900 px-5 text-sm font-semibold text-fg hover:bg-ink-700">
            <ExternalLink className="size-4" /> {L.openAgain}
          </a>
        )}
        <button onClick={onBack} className="inline-flex h-11 items-center rounded-full border border-line px-5 text-sm text-fg-muted hover:bg-surface-2">
          {L.backToLobby}
        </button>
      </div>
    </motion.div>
  );
}
