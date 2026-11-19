"use server";

import { z } from "zod";
import { ApiError, apiFetch, isMock } from "../api/client";
import type { ActionResult, LeadInput } from "../types";
import { parseIdentifier } from "../utils";
import { leadSchema } from "../schemas";

export async function submitLead(input: LeadInput): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  if (isMock) {
    console.info("[mock] lead received", parsed.data);
    await new Promise((r) => setTimeout(r, 700));
    return { ok: true };
  }

  try {
    await apiFetch("/leads", {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parseIdentifier(parsed.data.phone)!.value,
        business_goals: parsed.data.businessGoals,
        source: parsed.data.source ?? "website",
      }),
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError && e.fieldErrors) return { ok: false, error: e.message, fieldErrors: e.fieldErrors };
    return { ok: false, error: "Something went wrong. Please try again or WhatsApp us." };
  }
}
