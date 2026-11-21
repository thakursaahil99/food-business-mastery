/**
 * Domain types shared by the web portal (and, later, the Expo app via packages/shared).
 * Shapes mirror the Laravel API Resources described in CLAUDE.md §7–8.
 * All timestamps are ISO-8601 strings in UTC; format for display in Asia/Kolkata.
 */

export type Role = "student" | "coach" | "admin" | "super_admin";

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  avatar: string | null;
}

export interface Coach {
  id: number;
  name: string;
  title: string;
}

export type SessionType = "live" | "webinar" | "mentorship";
export type SessionStatus = "scheduled" | "live" | "completed" | "cancelled";

/** Where the class runs. Zoom is primary (client's current setup); LiveKit stays as a self-hosted option. */
export type MeetingPlatform = "zoom" | "livekit";

/**
 * off: recording disabled · scheduled: will auto-record (Zoom cloud recording) · recording: live now ·
 * processing: Zoom finished, we're downloading/transcoding to HLS · ready: playable in Learn · failed
 */
export type RecordingStatus = "off" | "scheduled" | "recording" | "processing" | "ready" | "failed";

export interface ClassSession {
  id: number;
  batchId: number;
  batchName: string;
  programTitle: string;
  title: string;
  description: string | null;
  type: SessionType;
  coach: Coach;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  moduleTitle: string | null;
  week: number | null;
  platform: MeetingPlatform;
  recordingEnabled: boolean;
  recordingStatus: RecordingStatus;
  /** Recording length once ready. */
  recordingDurationSec: number | null;
  recordingAvailable: boolean;
  /** Attendance for the current user, when the session is over (from Zoom participant webhooks). */
  attended: boolean | null;
  attendedSec: number | null;
}

export type LessonType = "video" | "pdf" | "live";

export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  type: LessonType;
  durationSec: number;
  order: number;
  isPreview: boolean;
  /** Seconds watched by the current user. */
  watchedSec: number;
  completed: boolean;
  locked: boolean;
  /**
   * Playable source. In mock mode this is a public demo file; with the API it is the
   * short-lived signed HLS URL from GET /lessons/{id}/stream. Null = not uploaded yet.
   */
  videoSrc?: string | null;
  posterSrc?: string | null;
  /** When the lesson opens for students (UTC ISO). Locked until then. Null/absent = follows its week. */
  releaseAt?: string | null;
}

/** A course students can watch: the enrolled program, or a short self-paced course. */
export interface Course {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  kind: "program" | "short";
  level: "Beginner" | "Intermediate" | "Advanced";
  coach: Coach;
  modules: ProgramModule[];
  /** Admin-created courses: longer description, run dates (UTC ISO) and publish state. */
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status?: "draft" | "published";
  /** Cover photo: a site path such as /photos/sector-hospitals.webp (or an uploaded image URL once the backend exists). */
  cover?: string | null;
}

/** Payload for creating a course from the admin panel. Dates are UTC ISO strings. */
export interface CourseDraft {
  title: string;
  tagline: string;
  description: string;
  level: Course["level"];
  coachId: number;
  startsAt: string;
  endsAt: string;
  publish: boolean;
  cover?: string | null;
  /** Ids are sent when editing, so existing lessons keep their video and student progress. */
  modules: { id?: number; title: string; lessons: { id?: number; title: string; releaseAt: string; fileName: string | null; isPreview: boolean }[] }[];
}

export interface ProgramModule {
  id: number;
  title: string;
  summary: string;
  order: number;
  weekFrom: number;
  weekTo: number;
  lessons: Lesson[];
}

export interface Batch {
  id: number;
  programId: number;
  name: string;
  startDate: string;
  endDate: string;
  seats: number;
  seatsTaken: number;
  coach: Coach;
  price: number;
  status: "upcoming" | "running" | "completed";
}

export type EnrollmentStatus = "pending" | "active" | "completed" | "cancelled";

export interface Enrollment {
  id: number;
  status: EnrollmentStatus;
  enrolledAt: string;
  batch: Batch;
  program: { id: number; title: string; slug: string; durationWeeks: number };
  progressPct: number;
  attendancePct: number;
  currentWeek: number;
}

export type InstallmentStatus = "paid" | "due" | "upcoming" | "overdue";

export interface Installment {
  id: number;
  label: string;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidAt: string | null;
  invoiceNo: string | null;
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

export interface LeadInput {
  name: string;
  email: string;
  phone: string;
  businessGoals: string;
  source?: string;
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/* ───────── Admin ───────── */

export type LeadStatus = "new" | "contacted" | "approved" | "rejected";

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  businessGoals: string;
  source: string;
  status: LeadStatus;
  assignedTo: string | null;
  createdAt: string;
}

export interface StudentRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  batchName: string;
  status: EnrollmentStatus;
  progressPct: number;
  attendancePct: number;
  paid: number;
  total: number;
  nextDue: string | null;
  joinedAt: string;
}

export interface PaymentRow {
  id: number;
  studentName: string;
  batchName: string;
  amount: number;
  gst: number;
  method: "UPI" | "Card" | "Netbanking" | "EMI";
  status: "captured" | "pending" | "failed" | "refunded";
  invoiceNo: string | null;
  razorpayPaymentId: string | null;
  paidAt: string;
}

export interface BatchSummary {
  id: number;
  programTitle: string;
  name: string;
  startDate: string;
  endDate: string;
  seats: number;
  seatsTaken: number;
  coachName: string;
  price: number;
  status: Batch["status"];
  currentWeek: number;
  attendancePct: number;
}

export interface AdminOverview {
  revenueThisMonth: number;
  revenueLastMonth: number;
  activeStudents: number;
  newLeads: number;
  avgAttendance: number;
  revenueByMonth: { month: string; amount: number }[];
  leadFunnel: { stage: string; count: number }[];
}

/* ───────── Assignments ───────── */

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
  /** The current student's submission (student views). */
  submission: Submission | null;
}

/** Admin view: an assignment with every student's submission. */
export interface AssignmentAdmin extends Omit<Assignment, "submission"> {
  enrolled: number;
  submissions: (Submission & { id: number; studentName: string })[];
}

/* ───────── Doubts (Ask a question) ───────── */

export type DoubtCategory = "Live class" | "Course content" | "Business" | "Technical" | "Payments";

export interface Doubt {
  id: number;
  studentName: string;
  category: DoubtCategory;
  subject: string;
  body: string;
  sessionTitle: string | null;
  createdAt: string;
  status: "open" | "answered";
  answer: { body: string; by: string; at: string } | null;
}

/* ───────── Billing (GST invoices) ───────── */

export interface BillingProfile {
  businessName: string;
  gstin: string;
  address: string;
  state: string;
}

/* ───────── Analytics (admin) ───────── */

export interface Bar {
  label: string;
  value: number;
  note?: string;
  href?: string;
}

export interface BusinessAnalytics {
  revenueFY: number;
  collectedThisMonth: number;
  outstanding: number;
  overdueCount: number;
  avgFeePerStudent: number;
  leadConversionPct: number;
  refundPct: number;
  revenueByMonth: Bar[];
  leadsBySource: Bar[];
  revenueByBatch: Bar[];
  paymentMethods: Bar[];
  dues: { studentId: number; name: string; batch: string; amount: number; dueDate: string; daysOverdue: number }[];
}

export interface LearningAnalytics {
  avgProgress: number;
  avgAttendance: number;
  submissionRate: number;
  avgScore: number;
  openDoubts: number;
  avgAnswerHours: number;
  attendanceByWeek: Bar[];
  moduleCompletion: Bar[];
  lessonDropoff: Bar[];
  homeworkSubmission: Bar[];
  atRisk: { studentId: number; name: string; batch: string; attendancePct: number; progressPct: number; reason: string }[];
}

export interface StudentProfile {
  student: StudentRow;
  city: string;
  businessType: string;
  lastActiveAt: string;
  watchTimeSec: number;
  loginsLast7d: number;
  homeworkAvgPct: number | null;
  attendance: { id: number; title: string; startsAt: string; attended: boolean | null; attendedSec: number | null; durationSec: number }[];
  modules: { title: string; done: number; total: number }[];
  homework: { title: string; status: "reviewed" | "submitted" | "missing" | "open"; score: number | null; maxScore: number; dueAt: string }[];
  doubts: { subject: string; status: "open" | "answered"; createdAt: string }[];
  payments: { label: string; amount: number; status: "paid" | "due" | "upcoming" | "overdue"; date: string }[];
  weeklyWatchMin: Bar[];
}

/** What the student wants to be reminded about (WhatsApp / email; push comes with the app). */
export interface ReminderPrefs {
  whatsapp: boolean;
  email: boolean;
  dayBefore: boolean;
  min15: boolean;
}

/* ───────── Certificates ───────── */

export interface CertificateStep {
  key: "attendance" | "lessons" | "homework" | "final";
  label: string;
  done: boolean;
  current: number;
  total: number;
  unit: "%" | null;
  hint?: string | null;
}

/** GET /my/certificates: one entry per course the student is on, with the certificate once all steps are met. */
export interface CertificateEntry {
  course: { id: number; slug: string; title: string; kind: "program" | "short"; batchName: string | null };
  status: "earned" | "in_progress";
  steps: CertificateStep[];
  stepsDone: number;
  /** url: the public page with the QR code (Laravel). Null in mock mode, where there is no such page. */
  certificate: { code: string; studentName: string; courseTitle: string; issuedAt: string; url: string | null } | null;
}
