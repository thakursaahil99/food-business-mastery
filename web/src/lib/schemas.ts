import { z } from "zod";
import { parseIdentifier } from "./utils";

/** Shared by the apply form (client) and the submitLead server action. */
export const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.email("Enter a valid email").trim(),
  phone: z
    .string()
    .trim()
    .refine((v) => parseIdentifier(v)?.kind === "phone", "Enter a 10-digit mobile number"),
  businessGoals: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(1000),
  source: z.string().max(40).optional(),
});

export type LeadForm = z.infer<typeof leadSchema>;
