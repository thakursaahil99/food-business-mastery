"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, useTransition } from "react";
import { Check, ChevronDown, Mail, MessageCircle, PhoneCall, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendPaymentLink, updateLeadStatus } from "@/lib/actions/admin";
import type { Lead, LeadStatus } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";
import { Avatar, Empty, LeadPill, Page, PageHeader, SearchInput, Tabs, fadeUp, leadStatusLabel } from "./ui";

type Filter = "all" | LeadStatus;

export function LeadsView({ initial }: { initial: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [filter, setFilter] = useState<Filter>("new");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [, start] = useTransition();

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: leads.length, new: 0, contacted: 0, approved: 0, rejected: 0 };
    leads.forEach((l) => c[l.status]++);
    return c;
  }, [leads]);

  const shown = leads.filter(
    (l) => (filter === "all" || l.status === filter) && (!q || `${l.name} ${l.email} ${l.phone} ${l.city}`.toLowerCase().includes(q.toLowerCase())),
  );

  const setStatus = (lead: Lead, status: LeadStatus) => {
    const prev = lead.status;
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    start(async () => {
      const res = await updateLeadStatus(lead.id, status);
      if (!res.ok) {
        setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, status: prev } : l)));
        toast.error(res.error);
        return;
      }
      toast.success(`${lead.name} → ${leadStatusLabel(status)}`, {
        action: { label: "Undo", onClick: () => setStatus({ ...lead, status }, prev) },
      });
    });
  };

  const payLink = (lead: Lead) =>
    start(async () => {
      const res = await sendPaymentLink(lead.id);
      if (res.ok) toast.success(`Payment link sent to ${lead.name}`, { description: "Via WhatsApp and email (Razorpay link in the payments phase)." });
      else toast.error(res.error);
    });

  return (
    <Page>
      <PageHeader title="Leads" sub="Applications from the website, social and webinars. Call new leads within 24 hours." />
      <motion.div variants={fadeUp} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          id="leads"
          value={filter}
          onChange={setFilter}
          options={(["new", "contacted", "approved", "rejected", "all"] as Filter[]).map((v) => ({ value: v, label: v === "all" ? "All" : leadStatusLabel(v), count: counts[v] }))}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search name, phone, city…" />
      </motion.div>

      <motion.div variants={fadeUp} className="overflow-hidden rounded-[24px] border border-line bg-surface">
        <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto] gap-4 border-b border-line px-5 py-3 text-xs font-medium uppercase tracking-wider text-fg-muted md:grid">
          <span>Lead</span>
          <span>Contact</span>
          <span>Source</span>
          <span>Status</span>
          <span className="w-8" />
        </div>
        {shown.length === 0 ? (
          <div className="p-5">
            <Empty>No leads in this view.</Empty>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((l) => {
                const isOpen = open === l.id;
                return (
                  <motion.li key={l.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }} transition={{ duration: 0.35 }}>
                    <button onClick={() => setOpen(isOpen ? null : l.id)} aria-expanded={isOpen} className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2/60 md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto]">
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={l.name} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-fg">{l.name}</span>
                          <span className="block truncate text-xs text-fg-muted">
                            {l.city} · {fmtDate(l.createdAt)}
                          </span>
                        </span>
                      </span>
                      <span className="hidden min-w-0 text-xs md:block">
                        <span className="block truncate text-fg">{l.phone}</span>
                        <span className="block truncate text-fg-muted">{l.email}</span>
                      </span>
                      <span className="hidden text-sm text-fg-muted md:block">{l.source}</span>
                      <span className="hidden md:block">
                        <LeadPill status={l.status} />
                      </span>
                      <ChevronDown className={cn("size-4 text-fg-muted transition-transform duration-300", isOpen && "rotate-180")} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                          <div className="grid grid-cols-1 gap-4 border-t border-line bg-surface-2/40 px-5 py-5 md:grid-cols-[1.4fr_1fr]">
                            <div>
                              <div className="text-xs uppercase tracking-wider text-fg-muted">Business goals</div>
                              <p className="mt-1.5 text-sm text-fg">{l.businessGoals}</p>
                              <div className="mt-4 flex flex-wrap gap-2 md:hidden">
                                <LeadPill status={l.status} />
                                <span className="text-xs text-fg-muted">{l.phone}</span>
                              </div>
                              <div className="mt-3 text-xs text-fg-muted">Assigned to: {l.assignedTo ?? "Unassigned"}</div>
                            </div>
                            <div className="flex flex-wrap content-start gap-2 md:justify-end">
                              <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm text-fg hover:bg-surface-2">
                                <MessageCircle className="size-4 text-emerald-600" /> WhatsApp
                              </a>
                              <a href={`mailto:${l.email}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm text-fg hover:bg-surface-2">
                                <Mail className="size-4" /> Email
                              </a>
                              {l.status === "new" && (
                                <Button size="sm" variant="outline" onClick={() => setStatus(l, "contacted")}>
                                  <PhoneCall /> Mark contacted
                                </Button>
                              )}
                              {(l.status === "new" || l.status === "contacted") && (
                                <>
                                  <Button size="sm" variant="success" onClick={() => setStatus(l, "approved")}>
                                    <Check /> Approve
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setStatus(l, "rejected")}>
                                    <X /> Reject
                                  </Button>
                                </>
                              )}
                              {l.status === "approved" && (
                                <Button size="sm" onClick={() => payLink(l)}>
                                  <Send /> Send payment link
                                </Button>
                              )}
                              {l.status === "rejected" && (
                                <Button size="sm" variant="outline" onClick={() => setStatus(l, "new")}>
                                  Reopen
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </motion.div>
    </Page>
  );
}
