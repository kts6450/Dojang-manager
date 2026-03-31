"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2, Pencil, PhoneCall, Users, TrendingUp, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, runAfterOverlayTransition } from "@/lib/utils";

interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  status: string;
  interestedIn?: string;
  trialDate?: string;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  new:       { label: "New",       color: "text-blue-700",    dot: "bg-blue-500",    bg: "bg-blue-50" },
  contacted: { label: "Contacted", color: "text-purple-700",  dot: "bg-purple-500",  bg: "bg-purple-50" },
  trial:     { label: "Trial",     color: "text-yellow-700",  dot: "bg-yellow-500",  bg: "bg-yellow-50" },
  converted: { label: "Converted", color: "text-emerald-700", dot: "bg-emerald-500", bg: "bg-emerald-50" },
  lost:      { label: "Lost",      color: "text-red-500",     dot: "bg-red-400",     bg: "bg-red-50" },
};

const SOURCE_CONFIG: Record<string, { label: string }> = {
  "walk-in": { label: "Walk-in" },
  referral:  { label: "Referral" },
  sns:       { label: "SNS" },
  website:   { label: "Website" },
  event:     { label: "Event" },
  other:     { label: "Other" },
};

const KANBAN_COLUMNS = ["new", "contacted", "trial", "converted", "lost"] as const;

const emptyForm = {
  name: "", email: "", phone: "", source: "walk-in", status: "new",
  interestedIn: "", trialDate: "", notes: "", followUpDate: "",
};

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    const statsMap: Record<string, number> = {};
    (data.stats ?? []).forEach((s: { _id: string; count: number }) => { statsMap[s._id] = s.count; });
    setStats(statsMap);
  }, [search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(lead: Lead) {
    setEditTarget(lead);
    setForm({
      name: lead.name, email: lead.email ?? "", phone: lead.phone ?? "",
      source: lead.source, status: lead.status, interestedIn: lead.interestedIn ?? "",
      trialDate: lead.trialDate ? lead.trialDate.split("T")[0] : "",
      notes: lead.notes ?? "",
      followUpDate: lead.followUpDate ? lead.followUpDate.split("T")[0] : "",
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!form.name) { toast.error("Name is required."); return; }
    const res = editTarget
      ? await fetch(`/api/leads/${editTarget._id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch("/api/leads", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

    if (res.ok) {
      toast.success(editTarget ? "Lead has been updated." : "Lead has been created.");
      setShowDialog(false);
      runAfterOverlayTransition(() => fetchLeads());
    } else {
      toast.error("An error occurred.");
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("Status has been updated.");
    runAfterOverlayTransition(() => fetchLeads());
  }

  async function handleDelete(id: string) {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    toast.success("Lead has been deleted.");
    runAfterOverlayTransition(() => fetchLeads());
  }

  const totalLeads = Object.values(stats).reduce((a, b) => a + b, 0);
  const conversionRate = totalLeads > 0
    ? Math.round(((stats.converted ?? 0) / totalLeads) * 100)
    : 0;

  return (
    <DashboardLayout>
      <Header title="CRM / Lead Management" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4 max-w-[1400px] mx-auto">

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Leads", value: totalLeads, icon: Users },
              { label: "In Trial", value: stats.trial ?? 0, icon: PhoneCall },
              { label: "Converted", value: stats.converted ?? 0, icon: UserCheck },
              { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="border border-slate-200 rounded-md px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-500 font-medium">{label}</span>
                  <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                </div>
                <p className="text-xl font-semibold text-slate-800 tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 items-center flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
                <Input placeholder="Search name, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-[13px]" />
              </div>
              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-28 h-8 text-[13px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex border border-slate-200 rounded-md overflow-hidden">
                {(["kanban", "list"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className={cn("px-3 py-1.5 text-[11px] font-medium transition-colors", view === v ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50")}>
                    {v === "kanban" ? "Kanban" : "List"}
                  </button>
                ))}
              </div>
              <Button onClick={openCreate} size="sm" className="h-8 gap-1.5 text-[13px]">
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} /> Add Lead
              </Button>
            </div>
          </div>

          {view === "kanban" && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {KANBAN_COLUMNS.map((col) => {
                const colConf = STATUS_CONFIG[col];
                const colLeads = leads.filter((l) => l.status === col);
                return (
                  <div key={col} className="border border-slate-200 rounded-md overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-200 bg-slate-50/60">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-1.5 h-1.5 rounded-full", colConf.dot)} />
                        <span className={cn("text-[11px] font-medium", colConf.color)}>{colConf.label}</span>
                        <span className="ml-auto text-[11px] font-medium text-slate-400 tabular-nums">{colLeads.length}</span>
                      </div>
                    </div>
                    <div className="p-1.5 space-y-1.5 min-h-[100px]">
                      {colLeads.length === 0 ? (
                        <div className="py-6 text-center">
                          <UserX className="w-5 h-5 text-slate-200 mx-auto" strokeWidth={1.5} />
                        </div>
                      ) : (
                        colLeads.map((lead) => (
                          <div key={lead._id}
                            className="border border-slate-200 rounded-md px-3 py-2 hover:border-slate-300 transition-colors cursor-pointer group"
                            onClick={() => openEdit(lead)}
                          >
                            <p className="text-[13px] font-medium text-slate-700 truncate">{lead.name}</p>
                            {lead.phone && <p className="text-[11px] text-slate-400 mt-0.5">{lead.phone}</p>}
                            {lead.interestedIn && (
                              <p className="text-[11px] text-blue-600 mt-1 truncate">{lead.interestedIn}</p>
                            )}
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[11px] text-slate-400">
                                {SOURCE_CONFIG[lead.source]?.label}
                              </span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {col !== "converted" && (
                                  <button
                                    className="text-[11px] text-emerald-600 border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 rounded-md font-medium hover:bg-emerald-100"
                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(lead._id, KANBAN_COLUMNS[KANBAN_COLUMNS.indexOf(col) + 1] ?? "converted"); }}
                                  >
                                    Next
                                  </button>
                                )}
                                <button
                                  className="text-slate-400 hover:text-red-500 p-0.5"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(lead._id); }}
                                >
                                  <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === "list" && (
            <Card className="border-slate-200 overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60">
                      {["Name", "Phone", "Source", "Interest", "Follow-up", "Status", "Created", ""].map((h) => (
                        <th key={h} className="text-left text-xs font-medium text-slate-500 py-2 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-10 text-slate-400 text-[13px]">No leads found.</td></tr>
                    ) : (
                      leads.map((lead) => {
                        const stConf = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
                        return (
                          <tr key={lead._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                            <td className="px-3 py-2">
                              <p className="text-[13px] font-medium text-slate-700">{lead.name}</p>
                              {lead.email && <p className="text-[11px] text-slate-400">{lead.email}</p>}
                            </td>
                            <td className="px-3 py-2 text-[13px] text-slate-500">{lead.phone ?? "-"}</td>
                            <td className="px-3 py-2 text-[13px] text-slate-500">
                              {SOURCE_CONFIG[lead.source]?.label ?? lead.source}
                            </td>
                            <td className="px-3 py-2 text-[13px] text-slate-500 max-w-[140px] truncate">{lead.interestedIn ?? "-"}</td>
                            <td className="px-3 py-2 text-[13px] text-slate-500">
                              {lead.followUpDate ? formatDate(lead.followUpDate) : "-"}
                            </td>
                            <td className="px-3 py-2">
                              <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md", stConf.bg, stConf.color)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", stConf.dot)} />
                                {stConf.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-[11px] text-slate-400">
                              {formatDate(lead.createdAt)}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600" onClick={() => openEdit(lead)}>
                                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-500" onClick={() => handleDelete(lead._id)}>
                                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[13px] font-semibold">{editTarget ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-medium text-slate-500">Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="h-8 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" className="h-8 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" className="h-8 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Source</Label>
                <Select value={form.source} onValueChange={(v) => v && setForm({ ...form, source: v })}>
                  <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Status</Label>
                <Select value={form.status} onValueChange={(v) => v && setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-medium text-slate-500">Interested Program</Label>
                <Input value={form.interestedIn} onChange={(e) => setForm({ ...form, interestedIn: e.target.value })} placeholder="Taekwondo, Kids Fitness, etc." className="h-8 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Trial Date</Label>
                <Input type="date" value={form.trialDate} onChange={(e) => setForm({ ...form, trialDate: e.target.value })} className="h-8 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Follow-up Date</Label>
                <Input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} className="h-8 text-[13px]" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-medium text-slate-500">Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Consultation notes, special requests, etc." className="text-[13px]" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit}>
              {editTarget ? "Save Changes" : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
