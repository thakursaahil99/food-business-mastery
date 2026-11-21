"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, useTransition } from "react";
import { Check, ChevronDown, Mail, MessageCircle, PhoneCall, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendPaymentLink, updateLeadStatus } from "@/lib/actions/admin";
import { deleteLead, saveLead, type LeadInput } from "@/lib/actions/admin-crud";
import { AddButton, ConfirmDelete, FormError, FormFooter, Modal, RowActions, Select, TextArea, TextInput, useAdminAction } from "./crud";
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
  const [editing, setEditing] = useState<Lead | "new" | null>(null);
  const [removing, setRemoving] = useState<Lead | null>(null);
  const del = useAdminAction();

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
      <PageHeader title="Leads" sub="Applications from the website, social and webinars. Call new leads within 24 hours." actions={<AddButton onClick={() => setEditing("new")}>Add lead</AddButton>} />
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
                              <RowActions onEdit={() => setEditing(l)} onDelete={() => setRemoving(l)} />
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

      <LeadForm
        key={editing === "new" ? "new" : (editing?.id ?? "none")}
        lead={editing}
        onClose={() => setEditing(null)}
        onSaved={(saved, isNew) => {
          setLeads((ls) => (isNew ? [saved, ...ls] : ls.map((l) => (l.id === saved.id ? { ...l, ...saved, createdAt: l.createdAt } : l))));
          if (isNew) setFilter(saved.status);
          setEditing(null);
        }}
      />
      <ConfirmDelete
        open={!!removing}
        onClose={() => setRemoving(null)}
        pending={del.pending}
        error={del.error}
        title="Delete this lead?"
        body={
          <>
            <b>{removing?.name}</b> and their application will be removed from the list. This can’t be undone.
          </>
        }
        onConfirm={() => {
          const l = removing!;
          del.run(() => deleteLead(l.id), `${l.name} deleted`, () => {
            setLeads((ls) => ls.filter((x) => x.id !== l.id));
            setRemoving(null);
          });
        }}
      />
    </Page>
  );
}

const SOURCES = ["Website", "Instagram", "Facebook", "YouTube", "Webinar", "Referral", "Walk-in", "Other"];

function LeadForm({ lead, onClose, onSaved }: { lead: Lead | "new" | null; onClose: () => void; onSaved: (l: Lead, isNew: boolean) => void }) {
  const editing = lead && lead !== "new" ? lead : null;
  const [f, setF] = useState<LeadInput>(() => ({
    name: editing?.name ?? "",
    email: editing?.email ?? "",
    phone: editing?.phone ?? "",
    city: editing?.city ?? "",
    businessGoals: editing?.businessGoals ?? "",
    source: editing?.source ?? "Website",
    status: editing?.status ?? "new",
    assignedTo: editing?.assignedTo ?? "",
  }));
  const set = <K extends keyof LeadInput>(k: K) => (v: LeadInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const act = useAdminAction();
  const sources = SOURCES.includes(f.source) ? SOURCES : [f.source, ...SOURCES];
  const save = () => act.run(() => saveLead(editing?.id ?? null, f), editing ? "Lead updated" : "Lead added", (r) => onSaved(r.data, !editing));

  return (
    <Modal open={!!lead} onClose={onClose} title={editing ? `Edit ${editing.name}` : "Add a lead"} sub={editing ? undefined : "For calls, walk-ins and referrals that didn't come through the website form."} footer={<FormFooter onCancel={onClose} onSave={save} pending={act.pending} saveLabel={editing ? "Save changes" : "Add lead"} />}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput label="Full name" value={f.name} onChange={set("name")} className="sm:col-span-2" autoComplete="off" />
        <TextInput label="Phone / WhatsApp" value={f.phone} onChange={set("phone")} inputMode="tel" placeholder="98765 43210" />
        <TextInput label="Email" value={f.email} onChange={set("email")} type="email" />
        <TextInput label="City" value={f.city} onChange={set("city")} />
        <Select label="Source" value={f.source} onChange={set("source")} options={sources.map((s) => ({ value: s, label: s }))} />
        <Select label="Status" value={f.status} onChange={set("status")} options={(["new", "contacted", "approved", "rejected"] as const).map((s) => ({ value: s, label: leadStatusLabel(s) }))} />
        <TextInput label="Assigned to" hint="optional" value={f.assignedTo ?? ""} onChange={set("assignedTo")} />
        <TextArea label="Business goals" value={f.businessGoals} onChange={set("businessGoals")} className="sm:col-span-2" maxLength={1000} />
      </div>
      <FormError error={act.error} />
    </Modal>
  );
}
