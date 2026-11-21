/** Shapes returned by the Laravel API (camelCase, same as web/src/lib/types.ts). */

export interface Coach {
  id: number;
  name: string;
  title: string;
}

export interface ClassSession {
  id: number;
  title: string;
  description: string | null;
  type: 'live' | 'webinar' | 'mentorship';
  coach: Coach | null;
  startsAt: string;
  endsAt: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  batchName: string;
  recordingAvailable: boolean;
  attended: boolean | null;
  attendedSec: number | null;
}

export interface Enrollment {
  id: number;
  status: string;
  batch: { id: number; name: string; coach: Coach | null; price: number };
  program: { id: number; title: string; slug: string; durationWeeks: number };
  progressPct: number;
  attendancePct: number;
  currentWeek: number;
}

export interface Lesson {
  id: number;
  title: string;
  type: 'video' | 'pdf' | 'live';
  durationSec: number;
  watchedSec: number;
  completed: boolean;
  locked: boolean;
  isPreview: boolean;
}

export interface ProgramModule {
  id: number;
  title: string;
  weekFrom: number;
  weekTo: number;
  lessons: Lesson[];
}

export interface Installment {
  id: number;
  label: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'due' | 'upcoming' | 'overdue';
  paidAt: string | null;
}

export interface PaymentSummary {
  total: number;
  gstPct: number;
  paid: number;
  installments: Installment[];
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  pinned: boolean;
}

export interface Submission {
  submittedAt: string;
  text: string;
  fileName: string | null;
  score: number | null;
  feedback: string | null;
  reviewedBy: string | null;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  moduleTitle: string | null;
  batchName: string;
  dueAt: string;
  maxScore: number;
  submission: Submission | null;
}

export type DoubtCategory = 'Live class' | 'Course content' | 'Business' | 'Technical' | 'Payments';

export interface Doubt {
  id: number;
  category: DoubtCategory;
  subject: string;
  body: string;
  sessionTitle: string | null;
  createdAt: string;
  status: 'open' | 'answered';
  answer: { body: string; by: string; at: string } | null;
}

export interface BillingProfile {
  businessName: string;
  gstin: string;
  address: string;
  state: string;
}

export interface ReminderPrefs {
  whatsapp: boolean;
  email: boolean;
  dayBefore: boolean;
  min15: boolean;
}

export interface LessonStream {
  url: string;
  durationSec: number;
  watchedSec: number;
}

export interface CertificateStep {
  key: 'attendance' | 'lessons' | 'homework' | 'final';
  label: string;
  done: boolean;
  current: number;
  total: number;
  unit: '%' | null;
  hint?: string | null;
}

/** GET /my/certificates: one entry per course the student is on. */
export interface CertificateEntry {
  course: { id: number; slug: string; title: string; kind: 'program' | 'short'; batchName: string | null };
  status: 'earned' | 'in_progress';
  steps: CertificateStep[];
  stepsDone: number;
  certificate: { code: string; studentName: string; courseTitle: string; issuedAt: string; url: string } | null;
}
