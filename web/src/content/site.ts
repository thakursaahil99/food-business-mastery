/**
 * Marketing copy for the public site. Source: bobbysingh.in + bobbysingh.in/crmp (see CLAUDE.md §1).
 * When the Laravel API is live, programs/curriculum come from GET /programs/{slug};
 * this file stays as the static fallback for SEO pages.
 */

export const brand = {
  name: "Redbean Academy",
  short: "Redbean",
  company: "Red Bean Hospitality",
  coach: "Bobby Singh",
  coachTitle: "MD, Red Bean Hospitality · Contract Food Business Coach",
  tagline: "India's academy for contract food entrepreneurs",
  whatsapp: "+91 00000 00000", // TODO: real number
  email: "hello@redbean.academy", // TODO: real address
};

export const nav = [
  { href: "/#program", label: "Program" },
  { href: "/#curriculum", label: "Curriculum" },
  { href: "/#coach", label: "Coach" },
  { href: "/#portal", label: "Academy app" },
  { href: "/#faq", label: "FAQ" },
];

export const stats = [
  { value: 20, suffix: "+", label: "Years in contract food" },
  { value: 350, suffix: "+", label: "Success stories" },
  { value: 4, suffix: "", label: "Sectors covered" },
  { value: 16, suffix: "", label: "Weeks of live training" },
];

export const sectors = ["Corporate", "Hospitals", "Institutions", "Industries"];

export const marqueeWords = [
  "Corporate cafeterias",
  "Hospital F&B",
  "Institutional catering",
  "Industrial canteens",
  "NABH",
  "HACCP",
  "Cost-plus contracts",
  "Clinical nutrition",
  "Tender & proposals",
  "Kitchen design",
];

export const pillars = [
  {
    letter: "C",
    title: "Cash",
    blurb:
      "Price contracts on a cost-plus model, control food cost line by line and keep your working capital healthy from the first month.",
    points: ["Cost-plus pricing", "Daily food-cost control", "Cash-flow discipline"],
  },
  {
    letter: "G",
    title: "Growth",
    blurb:
      "Win more sites across corporate, hospital, institutional and industrial clients with proposals and pitches that get signed.",
    points: ["Client acquisition", "Winning proposals", "Multi-site scaling"],
  },
  {
    letter: "R",
    title: "Royalty",
    blurb:
      "Build systems, brand and people so the business earns while you step back, and becomes an asset you own, not a job you run.",
    points: ["SOP-driven operations", "Team leadership", "Brand that compounds"],
  },
];

export const curriculum = [
  {
    tag: "Month 1",
    weeks: "Weeks 1–4",
    title: "Healthcare Infrastructure",
    topics: ["Kitchen layout & zoning", "Equipment planning", "Budgeting", "Workflow design"],
  },
  {
    tag: "Month 2",
    weeks: "Weeks 5–8",
    title: "Compliance & Standards",
    topics: ["NABH requirements", "HACCP", "Food safety systems", "Regulatory compliance"],
  },
  {
    tag: "Month 3",
    weeks: "Weeks 9–12",
    title: "Operations Management",
    topics: ["Staff & rostering", "Inventory & supply chain", "Cost control", "Performance monitoring"],
  },
  {
    tag: "Month 4",
    weeks: "Weeks 13–16",
    title: "Patient Care Integration",
    topics: ["Clinical nutrition", "Therapeutic diets", "Patient meal service", "Quality assurance"],
  },
  {
    tag: "Ongoing",
    weeks: "Throughout",
    title: "Business Development",
    topics: ["Contract negotiation", "Client acquisition", "Proposals & tenders", "Scaling to new sites"],
  },
  {
    tag: "Final",
    weeks: "Capstone",
    title: "Certification & Practice",
    topics: ["Live project", "Case studies", "Certification assessment", "1:1 mentorship"],
  },
];

export const benefits = [
  { icon: "Radio", title: "Weekly live classes", body: "Interactive sessions with Q&A, recorded so you never miss a week." },
  { icon: "Crown", title: "MD Sir assistance", body: "Direct mentorship from Bobby Singh on your real contracts and sites." },
  { icon: "Compass", title: "Business coach", body: "A dedicated coach to keep you accountable between classes." },
  { icon: "LayoutDashboard", title: "RFC CRM", body: "Track leads, proposals and clients in the CRM built for food contractors." },
  { icon: "Megaphone", title: "Social media support", body: "Content support to build authority with corporate and hospital buyers." },
  { icon: "CalendarCheck", title: "Webinars & events", body: "Industry webinars, guest experts and offline meet-ups." },
  { icon: "Flame", title: "Discipline classes", body: "Habits, routines and leadership for owners who want to scale." },
  { icon: "GraduationCap", title: "Certification", body: "Live project + assessment. Earn a verifiable Redbean certificate." },
];

/**
 * PLACEHOLDER stories — replace with real, consented success stories (managed from Filament in Phase 2).
 * Kept anonymous on purpose so nothing here can be mistaken for a genuine named review.
 */
export const stories = [
  { who: "Hospital F&B operator", where: "Pune", quote: "We moved two hospital contracts to cost-plus and finally know our margin every single day." },
  { who: "Corporate cafeteria owner", where: "Gurugram", quote: "The proposal templates alone helped us close a 900-cover IT park." },
  { who: "Industrial canteen contractor", where: "Ahmedabad", quote: "Food cost went from guesswork to a dashboard. That changed how I run the business." },
  { who: "First-time caterer", where: "Indore", quote: "I came in with one site. The pipeline system gave me a plan for five." },
  { who: "Institutional caterer", where: "Hyderabad", quote: "NABH and HACCP stopped being scary words. We passed our first audit clean." },
  { who: "Family catering business", where: "Ludhiana", quote: "Discipline classes were the surprise. My team runs without me on site now." },
];

export const faqs = [
  {
    q: "Who is the CGR Mastery Program for?",
    a: "Owners and aspiring founders in contract food: corporate cafeterias, hospital and healthcare F&B, institutional and industrial catering. Beginners get the full foundation; running businesses get systems to scale.",
  },
  {
    q: "How are classes delivered?",
    a: "Live classes every week inside the Redbean Academy app and web portal, with recordings available right after each class. Mentorship sessions with MD Sir are booked from the portal.",
  },
  {
    q: "What if I miss a live class?",
    a: "Every class is recorded and added to your portal, usually within a few hours. Your progress and attendance are tracked automatically.",
  },
  {
    q: "Is there an EMI or instalment option?",
    a: "Yes. You can pay in full or choose an instalment plan at checkout. GST invoices are generated automatically for every payment.",
  },
  {
    q: "Do I get a certificate?",
    a: "Yes. Complete the live project and final assessment to receive a Redbean certificate with a QR code anyone can verify online.",
  },
];

/* ───────── Program page: Udemy-style "what you'll learn / this program includes" ───────── */

export const programOutcomes = [
  "Price food contracts on a cost-plus model and protect your margin",
  "Design hospital and corporate kitchens with a clean one-way flow",
  "Pass NABH and HACCP audits with the right SOPs and daily logs",
  "Control food cost, inventory and vendors with simple weekly reviews",
  "Plan rosters for 24×7 sites without overtime surprises",
  "Run patient meal service, therapeutic diets and quality checks",
  "Read tenders and write proposals that get signed",
  "Negotiate cost-plus terms with procurement teams",
  "Grow from one site to many with systems and a strong team",
  "Build a contract food business that runs without you on site",
];

export const programIncludes = [
  { icon: "Video", text: "Weekly live classes for 16 weeks" },
  { icon: "PlayCircle", text: "Recordings of every class, watch any time" },
  { icon: "FileText", text: "Templates: costing sheets, SOPs, proposals, checklists" },
  { icon: "Crown", text: "1:1 mentorship with MD Sir (Bobby Singh)" },
  { icon: "LayoutDashboard", text: "Access to the RFC CRM for leads and clients" },
  { icon: "CalendarCheck", text: "Webinars, guest experts and offline meet-ups" },
  { icon: "Smartphone", text: "Learn on phone or computer, in Hindi or English" },
  { icon: "Award", text: "Certificate with QR verification on completion" },
];

export const programRequirements = [
  "No prior catering experience needed. We start from the basics.",
  "A phone or computer with internet for live classes on Zoom.",
  "About 4–6 hours a week for classes, recordings and homework.",
];

export const programAudience = [
  "Owners of corporate cafeterias, hospital canteens and industrial kitchens",
  "Caterers moving from events into steady contract business",
  "First-time founders who want to enter contract food the right way",
  "Hospitality professionals planning to start their own company",
];
