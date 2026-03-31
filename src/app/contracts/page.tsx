"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, AlertTriangle, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency, formatDate, runAfterOverlayTransition } from "@/lib/utils";

interface Contract {
  _id: string;
  userId: { _id: string; name: string; phone?: string; email?: string };
  title: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: string;
  signedAt?: string;
  notes?: string;
}

interface Member { _id: string; name: string; }

const STATUS_MAP: Record<string, { label: string; dot: string; text: string }> = {
  draft: { label: "Draft", dot: "bg-slate-400", text: "text-slate-600 bg-slate-50 border border-slate-200" },
  pending: { label: "Pending Signature", dot: "bg-yellow-500", text: "text-yellow-700 bg-yellow-50 border border-yellow-200" },
  signed: { label: "Signed", dot: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50 border border-emerald-200" },
  expired: { label: "Expired", dot: "bg-red-500", text: "text-red-700 bg-red-50 border border-red-200" },
  cancelled: { label: "Cancelled", dot: "bg-slate-400", text: "text-slate-500 bg-slate-50 border border-slate-200" },
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    userId: "", title: "Enrollment Agreement",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "", amount: "", terms: "This agreement governs the terms and conditions of the training service.", notes: "",
  });

  const fetchContracts = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/contracts?${params}`);
    const data = await res.json();
    setContracts(data.contracts ?? []);
    setExpiringSoon(data.expiringSoon ?? 0);
  }, [statusFilter]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);
  useEffect(() => {
    fetch("/api/members?limit=200").then((r) => r.json()).then((d) => setMembers(d.members ?? []));
  }, []);

  async function handleSubmit() {
    if (!form.userId || !form.title || !form.startDate || !form.endDate) {
      toast.error("Please fill in all required fields."); return;
    }
    const res = await fetch("/api/contracts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) || 0 }),
    });
    if (res.ok) {
      toast.success("Contract created successfully.");
      setShowDialog(false);
      runAfterOverlayTransition(() => fetchContracts());
    } else {
      const err = await res.json();
      toast.error(err.error || "An error occurred");
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/contracts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("Status updated successfully.");
    runAfterOverlayTransition(() => fetchContracts());
  }

  return (
    <DashboardLayout>
      <Header title="Contracts" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {expiringSoon > 0 && (
          <div className="border border-orange-200 rounded-md px-3 py-2 flex items-center gap-2 text-[13px] text-orange-700 bg-orange-50/50">
            <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>There are <strong>{expiringSoon}</strong> contracts expiring within 30 days.</span>
          </div>
        )}

        <div className="flex gap-3 items-center justify-between">
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : (v ?? ""))}>
            <SelectTrigger className="w-44 h-8 text-[13px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowDialog(true)} size="sm">
            <Plus className="w-4 h-4 mr-1.5" strokeWidth={1.5} /> Add Contract
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-[13px] font-medium">Member</TableHead>
                <TableHead className="text-[13px] font-medium">Title</TableHead>
                <TableHead className="text-[13px] font-medium">Amount</TableHead>
                <TableHead className="text-[13px] font-medium">Start Date</TableHead>
                <TableHead className="text-[13px] font-medium">End Date</TableHead>
                <TableHead className="text-[13px] font-medium">Signed Date</TableHead>
                <TableHead className="text-[13px] font-medium">Status</TableHead>
                <TableHead className="text-[13px] font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <FileText className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground/40" strokeWidth={1.5} />
                  <span className="text-[13px]">No contracts found.</span>
                </TableCell></TableRow>
              ) : (
                contracts.map((c) => {
                  const st = STATUS_MAP[c.status];
                  return (
                    <TableRow key={c._id}>
                      <TableCell className="py-2 text-[13px] font-medium">{c.userId?.name ?? "-"}</TableCell>
                      <TableCell className="py-2 text-[13px]">{c.title}</TableCell>
                      <TableCell className="py-2 text-[13px] font-medium">{formatCurrency(c.amount)}</TableCell>
                      <TableCell className="py-2 text-[13px] text-muted-foreground">{formatDate(c.startDate)}</TableCell>
                      <TableCell className="py-2 text-[13px] text-muted-foreground">{formatDate(c.endDate)}</TableCell>
                      <TableCell className="py-2 text-[13px] text-muted-foreground">{c.signedAt ? formatDate(c.signedAt) : "-"}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className={`rounded-md text-[11px] font-normal gap-1.5 ${st?.text ?? ""}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${st?.dot ?? "bg-slate-400"}`} />
                          {st?.label ?? c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/contracts/${c._id}`}>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Details / Sign">
                              <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </Button>
                          </Link>
                          <Select value={c.status} onValueChange={(v) => v !== null && updateStatus(c._id, v)}>
                            <SelectTrigger className="h-7 w-24 text-[11px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[15px] font-semibold">Add Contract</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-[13px]">Member *</Label>
              <Select value={form.userId} onValueChange={(v) => v !== null && setForm({ ...form, userId: v })}>
                <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[13px]">Title *</Label>
              <Input className="h-8 text-[13px]" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[13px]">Start Date *</Label>
                <Input className="h-8 text-[13px]" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[13px]">End Date *</Label>
                <Input className="h-8 text-[13px]" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[13px]">Amount ($)</Label>
              <Input className="h-8 text-[13px]" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[13px]">Terms</Label>
              <Textarea className="text-[13px]" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit}>Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
