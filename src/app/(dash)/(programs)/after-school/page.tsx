"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatCurrency, runAfterOverlayTransition } from "@/lib/utils";

interface AfterSchoolRecord {
  _id: string;
  studentId: { _id: string; name: string; phone?: string };
  programName: string;
  schedule: { dayOfWeek: number[]; startTime: string; endTime: string };
  startDate: string;
  endDate?: string;
  status: string;
  tuitionAmount?: number;
}

interface Member { _id: string; name: string; }

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive:  { label: "Inactive",  className: "bg-slate-50 text-slate-600 border-slate-200" },
  completed: { label: "Completed", className: "bg-blue-50 text-blue-700 border-blue-200" },
};

export default function AfterSchoolPage() {
  const [records, setRecords] = useState<AfterSchoolRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    studentId: "", programName: "After School Taekwondo",
    startTime: "15:00", endTime: "17:00",
    dayOfWeek: [1, 2, 3, 4, 5] as number[],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "", tuitionAmount: "", notes: "",
  });

  const fetchRecords = useCallback(async () => {
    const res = await fetch("/api/after-school");
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => {
    fetch("/api/members?limit=200&role=student").then((r) => r.json()).then((d) => setMembers(d.members ?? []));
  }, []);

  function toggleDay(day: number) {
    setForm(f => ({
      ...f,
      dayOfWeek: f.dayOfWeek.includes(day)
        ? f.dayOfWeek.filter(d => d !== day)
        : [...f.dayOfWeek, day].sort(),
    }));
  }

  async function handleSubmit() {
    if (!form.studentId || !form.programName || !form.startDate) {
      toast.error("Please fill in all required fields."); return;
    }
    const res = await fetch("/api/after-school", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: form.studentId, programName: form.programName,
        schedule: { dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime: form.endTime },
        startDate: form.startDate, endDate: form.endDate || undefined,
        tuitionAmount: form.tuitionAmount ? Number(form.tuitionAmount) : undefined,
        notes: form.notes,
      }),
    });
    if (res.ok) {
      toast.success("After school program has been registered.");
      setShowDialog(false);
      runAfterOverlayTransition(() => fetchRecords());
    } else {
      const err = await res.json();
      toast.error(err.error || "An error occurred");
    }
  }

  return (
    <>
      <Header title="After School Management" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              <span className="text-[13px] text-slate-500">Total {records.length} students</span>
            </div>
            <Button onClick={() => setShowDialog(true)} size="sm" className="h-8 gap-1.5 text-[13px]">
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} /> Enroll Student
            </Button>
          </div>

          <Card className="border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    {["Student", "Program", "Class Days", "Time", "Start Date", "Tuition", "Status"].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-slate-500 py-2 px-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-14">
                        <GraduationCap className="w-7 h-7 mx-auto mb-2 text-slate-200" strokeWidth={1.5} />
                        <p className="text-[13px] text-slate-400">No after school students found.</p>
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => {
                      const statusConf = STATUS_MAP[r.status] ?? STATUS_MAP.inactive;
                      return (
                        <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-2">
                            <p className="text-[13px] font-medium text-slate-700">{r.studentId?.name ?? "-"}</p>
                            {r.studentId?.phone && (
                              <p className="text-[11px] text-slate-400">{r.studentId.phone}</p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[13px] text-slate-600">{r.programName}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              {r.schedule?.dayOfWeek?.map(d => (
                                <span key={d} className="text-[11px] font-medium text-slate-600 border border-slate-200 rounded px-1 py-0.5">
                                  {DAY_NAMES[d]}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[13px] text-slate-500 tabular-nums">
                            {r.schedule?.startTime} – {r.schedule?.endTime}
                          </td>
                          <td className="px-3 py-2 text-[13px] text-slate-500">
                            {formatDate(r.startDate)}
                          </td>
                          <td className="px-3 py-2 text-[13px] text-slate-700 font-medium tabular-nums">
                            {r.tuitionAmount ? formatCurrency(r.tuitionAmount) : "-"}
                          </td>
                          <td className="px-3 py-2">
                            <span className={cn("inline-flex text-[11px] font-medium px-2 py-0.5 rounded-md border", statusConf.className)}>
                              {statusConf.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-[13px] font-semibold">Enroll After School Student</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-500">Student *</Label>
              <Select value={form.studentId} onValueChange={(v) => v !== null && setForm({ ...form, studentId: v })}>
                <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-500">Program Name *</Label>
              <Input value={form.programName} onChange={(e) => setForm({ ...form, programName: e.target.value })} className="h-8 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-500">Class Days</Label>
              <div className="flex gap-1">
                {DAY_NAMES.map((name, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={cn(
                      "w-8 h-7 rounded-md text-[11px] font-medium transition-colors border",
                      form.dayOfWeek.includes(i)
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Start Time</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="h-8 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">End Time</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="h-8 text-[13px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Start Date *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="h-8 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Monthly Tuition</Label>
                <Input type="number" value={form.tuitionAmount} onChange={(e) => setForm({ ...form, tuitionAmount: e.target.value })} className="h-8 text-[13px]" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
