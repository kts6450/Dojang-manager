"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserCheck, UserX, Clock, CalendarCheck, QrCode } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn, formatDate, runAfterOverlayTransition } from "@/lib/utils";

interface AttendanceRecord {
  _id: string;
  userId: { _id: string; name: string; belt?: string };
  classType: string;
  date: string;
  status: string;
  method: string;
  notes?: string;
}

interface Member { _id: string; name: string; }

const STATUS_MAP: Record<string, { label: string; dot: string }> = {
  present: { label: "Present", dot: "bg-emerald-500" },
  absent: { label: "Absent", dot: "bg-red-500" },
  late: { label: "Late", dot: "bg-yellow-500" },
  excused: { label: "Excused", dot: "bg-blue-500" },
};

const CLASS_TYPES = ["Taekwondo", "Hapkido", "Judo", "Kendo", "Boxing", "After School", "Other"];

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, excused: 0 });
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    userId: "", classType: "Taekwondo", date: new Date().toISOString().split("T")[0],
    status: "present", method: "manual", notes: "",
  });

  const fetchRecords = useCallback(async () => {
    const params = new URLSearchParams({ dateFrom, dateTo });
    const res = await fetch(`/api/attendance?${params}`);
    const data = await res.json();
    setRecords(data.records ?? []);
    setTotal(data.total ?? 0);

    const s = { present: 0, absent: 0, late: 0, excused: 0 };
    (data.records ?? []).forEach((r: AttendanceRecord) => {
      if (r.status in s) s[r.status as keyof typeof s]++;
    });
    setStats(s);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetch("/api/members?limit=200").then((r) => r.json()).then((d) => setMembers(d.members ?? []));
  }, []);

  async function handleSubmit() {
    if (!form.userId) { toast.error("Please select a member."); return; }
    const res = await fetch("/api/attendance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Attendance recorded successfully.");
      setShowDialog(false);
      runAfterOverlayTransition(() => fetchRecords());
    } else {
      const err = await res.json();
      toast.error(err.error || "An error occurred");
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/attendance/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("Status updated successfully.");
    runAfterOverlayTransition(() => fetchRecords());
  }

  const statCards = [
    { label: "Present", value: stats.present, icon: UserCheck, dot: "bg-emerald-500" },
    { label: "Absent", value: stats.absent, icon: UserX, dot: "bg-red-500" },
    { label: "Late", value: stats.late, icon: Clock, dot: "bg-yellow-500" },
    { label: "Excused", value: stats.excused, icon: CalendarCheck, dot: "bg-blue-500" },
  ];

  return (
    <DashboardLayout>
      <Header title="Attendance" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <section className="rounded-xl border bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                Daily check-in
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Keep class attendance visible in real time.</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Track attendance trends, resolve status changes, and run QR-based front desk check-in.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/attendance/qr-scan">
                <Button variant="outline" className="h-9 gap-1.5">
                  <QrCode className="h-4 w-4" strokeWidth={1.5} /> QR Check-in
                </Button>
              </Link>
              <Button onClick={() => setShowDialog(true)} className="h-9">
                <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.5} /> Add Attendance
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900">Attendance window</h3>
              <p className="text-[11px] text-muted-foreground">Review records across a selected date range</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-40 text-[13px]" />
              <span className="text-[11px] text-muted-foreground">to</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-40 text-[13px]" />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map(({ label, value, icon: Icon, dot }) => (
            <Card key={label} className="rounded-xl border bg-white shadow-none">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</span>
                  <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
                </div>
                <p className="text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
                  <span className="text-[11px] text-muted-foreground">of {total} total</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden rounded-xl border bg-white shadow-none">
          <div className="px-4 py-2.5 border-b">
            <h3 className="text-[13px] font-medium text-slate-800">Attendance Records</h3>
            <p className="text-[11px] text-muted-foreground">{total} records</p>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-slate-50/80">
                  <TableHead className="pl-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Member</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground py-2">Class</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground py-2">Date</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground py-2">Status</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground py-2">Method</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground py-2 pr-4">Change Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <p className="text-[13px] text-muted-foreground">No attendance records found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((r) => {
                    const statusConf = STATUS_MAP[r.status] ?? { label: r.status, dot: "bg-slate-400" };
                    return (
                      <TableRow key={r._id} className="hover:bg-slate-50/50 border-b last:border-b-0">
                        <TableCell className="text-[13px] font-medium text-slate-800 pl-4 py-2">{r.userId?.name ?? "—"}</TableCell>
                        <TableCell className="text-[13px] text-muted-foreground py-2">{r.classType}</TableCell>
                        <TableCell className="text-[13px] text-muted-foreground py-2">
                          {formatDate(r.date)}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusConf.dot)} />
                            <span className="text-[11px] text-muted-foreground">{statusConf.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground py-2">
                          {r.method === "qr" ? "QR" : "Manual"}
                        </TableCell>
                        <TableCell className="pr-4 py-2">
                          <Select value={r.status} onValueChange={(v) => v !== null && updateStatus(r._id, v)}>
                            <SelectTrigger className="h-7 w-24 text-[11px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="excused">Excused</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[13px] font-semibold">Add Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5 py-1">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Member *</Label>
              <Select value={form.userId} onValueChange={(v) => v !== null && setForm({ ...form, userId: v })}>
                <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Class Type *</Label>
              <Select value={form.classType} onValueChange={(v) => v !== null && setForm({ ...form, classType: v })}>
                <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASS_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Date *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-8 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => v !== null && setForm({ ...form, status: v })}>
                <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)} className="text-[13px]">Cancel</Button>
            <Button size="sm" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-[13px]">Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
