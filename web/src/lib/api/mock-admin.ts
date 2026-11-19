import "server-only";
import type { AdminOverview, BatchSummary, Lead, LeadStatus, PaymentRow, StudentRow } from "../types";

/**
 * Deterministic admin mock data (relative to `now`). Replaced by Laravel admin endpoints
 * (GET /admin/overview, /admin/leads, /admin/students, /admin/payments, /admin/batches).
 * Names are generic samples, not real people.
 */

const first = ["Aarav", "Vivaan", "Ananya", "Diya", "Ishaan", "Kabir", "Meera", "Neha", "Pranav", "Riya", "Saanvi", "Tanvi", "Arjun", "Kavya", "Rohan", "Sneha", "Varun", "Pooja", "Nikhil", "Aditi", "Harsh", "Simran", "Yash", "Isha"];
const last = ["Sharma", "Verma", "Gupta", "Mehta", "Reddy", "Nair", "Iyer", "Singh", "Kapoor", "Joshi", "Patel", "Bansal"];
const cities = ["Delhi", "Mumbai", "Pune", "Bengaluru", "Hyderabad", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Indore", "Kochi", "Ludhiana"];
const goals = [
  "Want to win my first hospital canteen contract.",
  "Running 2 corporate cafeterias, want to scale to 6.",
  "Moving from events catering to contract catering.",
  "Need NABH/HACCP compliance for an upcoming tender.",
  "Industrial canteen, margins are too thin. Want cost-plus.",
  "Starting fresh with a cloud kitchen, exploring institutions.",
];
const sources = ["Website", "Instagram", "YouTube", "Referral", "WhatsApp", "Webinar"];

const name = (i: number) => `${first[i % first.length]} ${last[(i * 7) % last.length]}`;
const email = (i: number) => `${first[i % first.length]!.toLowerCase()}.${last[(i * 7) % last.length]!.toLowerCase()}${i}@example.com`;
const phone = (i: number) => `+91 9${String(800000000 + ((i * 7919) % 199999999)).slice(0, 4)} ${String(10000 + ((i * 3571) % 89999))}`;
const ago = (now: Date, hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString();

export function mockLeads(now = new Date()): Lead[] {
  const statuses: LeadStatus[] = ["new", "new", "contacted", "new", "approved", "contacted", "rejected", "new", "contacted", "approved", "new", "contacted", "approved", "new", "rejected", "contacted", "new", "approved"];
  return statuses.map((status, i) => ({
    id: 300 + i,
    name: name(i + 3),
    email: email(i + 3),
    phone: phone(i + 3),
    city: cities[i % cities.length]!,
    businessGoals: goals[i % goals.length]!,
    source: sources[(i * 5) % sources.length]!,
    status,
    assignedTo: status === "new" ? null : i % 2 ? "Anjali (Sales)" : "Karan (Sales)",
    createdAt: ago(now, 3 + i * 11),
  }));
}

export function mockStudents(now = new Date()): StudentRow[] {
  return Array.from({ length: 22 }, (_, i) => {
    const batch = i < 14 ? "Batch 07 · Oct 2026" : "Batch 06 · Jun 2026";
    const total = 150000;
    const paid = i < 14 ? 25000 * (1 + ((i * 3) % 5)) : total;
    return {
      id: 100 + i,
      name: name(i + 11),
      email: email(i + 11),
      phone: phone(i + 11),
      batchName: batch,
      status: i === 9 ? "cancelled" : i >= 14 ? (i % 4 === 0 ? "active" : "completed") : "active",
      progressPct: i >= 14 ? 100 - (i % 3) * 6 : 25 + ((i * 13) % 40),
      attendancePct: 62 + ((i * 17) % 37),
      paid,
      total,
      nextDue: paid < total ? new Date(now.getTime() + ((i % 9) - 2) * 86_400_000).toISOString() : null,
      joinedAt: ago(now, 24 * (40 + i * 5)),
    };
  });
}

export function mockAdminPayments(now = new Date()): PaymentRow[] {
  const methods: PaymentRow["method"][] = ["UPI", "UPI", "Card", "Netbanking", "EMI", "UPI"];
  const statuses: PaymentRow["status"][] = ["captured", "captured", "captured", "pending", "captured", "failed", "captured", "captured", "refunded", "captured", "captured", "captured"];
  return statuses.map((status, i) => {
    const amount = i % 4 === 0 ? 150000 : 25000;
    return {
      id: 9000 + i,
      studentName: name(i + 11),
      batchName: i % 3 === 2 ? "Batch 06 · Jun 2026" : "Batch 07 · Oct 2026",
      amount,
      gst: Math.round(amount * 0.18),
      method: methods[i % methods.length]!,
      status,
      invoiceNo: status === "captured" ? `RBH/26-27/0${612 - i * 7}` : null,
      razorpayPaymentId: status === "pending" ? null : `pay_${(0x5f3a91 * (i + 3)).toString(36).toUpperCase()}`,
      paidAt: ago(now, 5 + i * 19),
    };
  });
}

export function mockBatches(now = new Date()): BatchSummary[] {
  const d = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString();
  return [
    { id: 8, programTitle: "CGR Mastery Program", name: "Batch 08 · Jan 2027", startDate: d(46), endDate: d(46 + 112), seats: 40, seatsTaken: 29, coachName: "Bobby Singh", price: 150000, status: "upcoming", currentWeek: 0, attendancePct: 0 },
    { id: 7, programTitle: "CGR Mastery Program", name: "Batch 07 · Oct 2026", startDate: d(-44), endDate: d(68), seats: 40, seatsTaken: 34, coachName: "Bobby Singh", price: 150000, status: "running", currentWeek: 7, attendancePct: 87 },
    { id: 6, programTitle: "CGR Mastery Program", name: "Batch 06 · Jun 2026", startDate: d(-160), endDate: d(-48), seats: 40, seatsTaken: 38, coachName: "Bobby Singh", price: 135000, status: "completed", currentWeek: 16, attendancePct: 81 },
  ];
}

export function mockOverview(now = new Date()): AdminOverview {
  const months: { month: string; amount: number }[] = [];
  const amounts = [1185000, 1420000, 980000, 1760000, 2135000, 1890000];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.toLocaleString("en-IN", { month: "short" }), amount: amounts[5 - i]! });
  }
  const leads = mockLeads(now);
  return {
    revenueThisMonth: amounts[5]!,
    revenueLastMonth: amounts[4]!,
    activeStudents: mockStudents(now).filter((s) => s.status === "active").length,
    newLeads: leads.filter((l) => l.status === "new").length,
    avgAttendance: 84,
    revenueByMonth: months,
    leadFunnel: [
      { stage: "Applied", count: 412 },
      { stage: "Contacted", count: 286 },
      { stage: "Discovery call", count: 171 },
      { stage: "Approved", count: 94 },
      { stage: "Enrolled", count: 72 },
    ],
  };
}
