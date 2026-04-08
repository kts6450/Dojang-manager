"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CreditCard, AlertCircle, CheckCircle, Clock, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, runAfterOverlayTransition } from "@/lib/utils";

function OverdueEmailButton() {
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "overdue" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Overdue notices sent: ${data.sent}/${data.total} members`);
      } else {
        toast.error(data.error ?? "Failed to send");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
      onClick={handleSend}
      disabled={loading}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : <Mail className="w-4 h-4" strokeWidth={1.5} />}
      Send Overdue Notices
    </Button>
  );
}

interface TuitionItem {
  _id: string;
  userId: { _id: string; name: string; phone?: string };
  amount: number;
  description: string;
  dueDate: string;
  paidAt?: string;
  status: string;
  paymentMethod?: string;
  notes?: string;
}

interface Member { _id: string; name: string; }

const STATUS_MAP: Record<string, { label: string; dot: string; text: string }> = {
  pending: { label: "Pending", dot: "bg-yellow-500", text: "text-yellow-700 bg-yellow-50 border border-yellow-200" },
  paid: { label: "Paid", dot: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50 border border-emerald-200" },
  overdue: { label: "Overdue", dot: "bg-red-500", text: "text-red-700 bg-red-50 border border-red-200" },
  cancelled: { label: "Cancelled", dot: "bg-slate-400", text: "text-slate-600 bg-slate-50 border border-slate-200" },
};

export default function TuitionPage() {
  const [items, setItems] = useState<TuitionItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [summary, setSummary] = useState<{ paid: number; pending: number; overdue: number }>({ paid: 0, pending: 0, overdue: 0 });
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    userId: "", amount: "", description: "Monthly Tuition",
    dueDate: new Date().toISOString().split("T")[0], notes: "",
  });

  const fetchItems = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/tuition?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);

    const s = { paid: 0, pending: 0, overdue: 0 };
    (data.summary ?? []).forEach((x: { _id: string; count: number }) => {
      if (x._id in s) s[x._id as keyof typeof s] = x.count;
    });
    setSummary(s);
  }, [statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => {
    fetch("/api/members?limit=200").then((r) => r.json()).then((d) => setMembers(d.members ?? []));
  }, []);

  async function handleSubmit() {
    if (!form.userId || !form.amount || !form.dueDate) {
      toast.error("Please fill in all required fields."); return;
    }
    const res = await fetch("/api/tuition", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    if (res.ok) {
      toast.success("Tuition record created successfully.");
      setShowDialog(false);
      setForm({ userId: "", amount: "", description: "Monthly Tuition", dueDate: new Date().toISOString().split("T")[0], notes: "" });
      runAfterOverlayTransition(() => fetchItems());
    } else {
      const err = await res.json();
      toast.error(err.error || "An error occurred");
    }
  }

  async function markPaid(id: string) {
    const res = await fetch(`/api/tuition/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid", paymentMethod: "cash", paidAt: new Date() }),
    });
    if (res.ok) {
      toast.success("Payment recorded successfully.");
    } else {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "Failed to record payment.");
    }
    runAfterOverlayTransition(() => fetchItems());
  }

  const totalAmount = items.reduce((sum, i) => i.status === "paid" ? sum + i.amount : sum, 0);

  return (
    <>
      <Header title="Tuition" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <section className="rounded-xl border bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                Revenue operations
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Keep tuition collection visible and actionable.</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Follow payment risk, send overdue reminders, and update collection status from one view.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <OverdueEmailButton />
              <Button onClick={() => setShowDialog(true)} className="h-9">
                <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.5} /> Add Tuition
              </Button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Paid", value: summary.paid, icon: CheckCircle, color: "text-emerald-600" },
            { label: "Pending", value: summary.pending, icon: Clock, color: "text-yellow-600" },
            { label: "Overdue", value: summary.overdue, icon: AlertCircle, color: "text-red-600" },
            { label: "This Month Revenue", value: formatCurrency(totalAmount), icon: CreditCard, color: "text-slate-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="rounded-xl border bg-white p-4 shadow-none">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
              <div className="mt-2 flex items-start justify-between gap-2">
                <span className="text-3xl font-semibold tracking-tight text-slate-950">{value}</span>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.5} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <section className="rounded-xl border bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900">Payment records</h3>
              <p className="text-[11px] text-muted-foreground">Filter and review tuition by collection status</p>
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : (v ?? ""))}>
              <SelectTrigger className="h-9 w-44 text-[13px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <div className="overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Member</TableHead>
                <TableHead className="text-[13px] font-medium">Phone</TableHead>
                <TableHead className="text-[13px] font-medium">Description</TableHead>
                <TableHead className="text-[13px] font-medium">Amount</TableHead>
                <TableHead className="text-[13px] font-medium">Due Date</TableHead>
                <TableHead className="text-[13px] font-medium">Paid Date</TableHead>
                <TableHead className="text-[13px] font-medium">Status</TableHead>
                <TableHead className="text-[13px] font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-[13px]">No data found.</TableCell></TableRow>
              ) : (
                items.map((item) => {
                  const st = STATUS_MAP[item.status];
                  return (
                    <TableRow key={item._id}>
                      <TableCell className="py-2 text-[13px] font-medium">{item.userId?.name ?? "-"}</TableCell>
                      <TableCell className="py-2 text-[13px] text-muted-foreground">{item.userId?.phone ?? "-"}</TableCell>
                      <TableCell className="py-2 text-[13px]">{item.description}</TableCell>
                      <TableCell className="py-2 text-[13px] font-medium">{formatCurrency(item.amount)}</TableCell>
                      <TableCell className="py-2 text-[13px] text-muted-foreground">{formatDate(item.dueDate)}</TableCell>
                      <TableCell className="py-2 text-[13px] text-muted-foreground">{item.paidAt ? formatDate(item.paidAt) : "-"}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className={`rounded-md text-[11px] font-normal ${st?.text ?? ""}`}>
                          {st?.label ?? item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        {item.status !== "paid" && item.status !== "cancelled" && (
                          <Button size="sm" variant="outline" onClick={() => markPaid(item._id)} className="h-7 text-[11px] text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-[15px] font-semibold">Add Tuition</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-[13px]">Member *</Label>
              <Select value={form.userId} onValueChange={(v) => v !== null && setForm({ ...form, userId: v })}>
                <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[13px]">Description</Label>
              <Input className="h-8 text-[13px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[13px]">Amount ($) *</Label>
              <Input className="h-8 text-[13px]" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="120" />
            </div>
            <div className="space-y-1">
              <Label className="text-[13px]">Due Date *</Label>
              <Input className="h-8 text-[13px]" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit}>Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
