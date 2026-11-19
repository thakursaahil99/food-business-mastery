"use server";

import { ApiError, apiFetch, isMock } from "../api/client";
import { getSessionById } from "../api/data";
import { getJoinState } from "../join-window";
import type { ActionResult } from "../types";

type JoinGrant =
  | { mode: "mock"; platform: "zoom" | "livekit" }
  | { mode: "zoom"; joinUrl: string }
  | { mode: "livekit"; url: string; token: string };

/**
 * Asks the backend for the student's join credentials. For Zoom that's the student's own
 * registrant join_url (unique per student → attendance via participant webhooks). The window
 * check here is a courtesy; Laravel re-validates enrollment + window with its own clock.
 */
export async function requestJoin(sessionId: number): Promise<ActionResult<JoinGrant>> {
  const session = await getSessionById(sessionId);
  if (!session) return { ok: false, error: "Class not found." };

  const js = getJoinState(session, Date.now());
  if (js.state === "upcoming") return { ok: false, error: "This class isn't open yet. Join opens 10 minutes before start." };
  if (js.state === "ended") return { ok: false, error: "This class has ended. The recording will be in Learn soon." };
  if (js.state === "cancelled") return { ok: false, error: "This class was cancelled." };

  if (isMock) return { ok: true, data: { mode: "mock", platform: session.platform } };

  try {
    const res = await apiFetch<{ join_url?: string; url?: string; token?: string }>(`/sessions/${sessionId}/join`, { method: "POST" });
    if (session.platform === "zoom" && res.join_url) return { ok: true, data: { mode: "zoom", joinUrl: res.join_url } };
    return { ok: true, data: { mode: "livekit", url: res.url!, token: res.token! } };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : "Couldn't join right now. Please retry." };
  }
}
