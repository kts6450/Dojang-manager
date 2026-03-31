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
import { Plus, Award, Zap, CheckCircle2, XCircle, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDate, runAfterOverlayTransition } from "@/lib/utils";

interface BeltRecord {
  _id: string;
  userId: { _id: string; name: string; belt?: string; beltLevel?: number };
  belt: string;
  beltLevel: number;
  previousBelt?: string;
  examDate: string;
  examResult: string;
  examScore?: number;
  notes?: string;
  promotedAt?: string;
}

interface Member { _id: string; name: string; belt?: string; }

const BELT_OPTIONS = [
  { value: "white", label: "White Belt" },
  { value: "yellow", label: "Yellow Belt" },
  { value: "orange", label: "Orange Belt" },
  { value: "green", label: "Green Belt" },
  { value: "blue", label: "Blue Belt" },
  { value: "purple", label: "Purple Belt" },
  { value: "red", label: "Red Belt" },
  { value: "brown", label: "Brown Belt" },
  { value: "black", label: "Black Belt" },
];

const BELT_COLORS: Record<string, string> = {
  white: "bg-white border border-slate-300",
  yellow: "bg-yellow-400",
  orange: "bg-orange-400",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
  brown: "bg-amber-800",
  black: "bg-slate-900",
};

const RESULT_MAP: Record<string, { label: string; className: string }> = {
  pass: { label: "Pass", className: "border-green-200 bg-green-50 text-green-700" },
  fail: { label: "Fail", className: "border-red-200 bg-red-50 text-red-700" },
  pending: { label: "Pending", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
};

interface AutoPromoteCandidate {
  memberId: string;
  memberName: string;
  currentBelt: string;
  currentBeltLabel: string;
  nextBelt: string;
  nextBeltLabel: string;
  attendanceCount: number;
  minAttendance: number;
  daysSince: number;
  minDays: number;
  isEligible: boolean;
}

export default function BeltRankPage() {
  const [records, setRecords] = useState<BeltRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [tab, setTab] = useState<"history" | "auto">("history");
  const [autoCandidates, setAutoCandidates] = useState<AutoPromoteCandidate[]>([]);
  const [autoLoading, setAutoLoading] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [form, setForm] = useState({
    userId: "", belt: "yellow", beltLevel: 1,
    examDate: new Date().toISOString().split("T")[0],
    examResult: "pending", examScore: "", notes: "",
  });

  const fetchRecords = useCallback(async () => {
    const res = await fetch("/api/belt-rank");
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => {
    fetch("/api/members?limit=200").then((r) => r.json()).then((d) => setMembers(d.members ?? []));
  }, []);

  async function fetchAutoCandidates() {
    setAutoLoading(true);
    const res = await fetch("/api/belt-rank/auto-promote");
    const data = await res.json();
    setAutoCandidates(data.members ?? []);
    setAutoLoading(false);
  }

  useEffect(() => {
    if (tab === "auto") fetchAutoCandidates();
  }, [tab]);

  async function handleAutoPromote(memberId: string) {
    setPromoting(memberId);
    try {
      const res = await fetch("/api/belt-rank/auto-promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        runAfterOverlayTransition(() => {
          fetchAutoCandidates();
          fetchRecords();
        });
      } else {
        toast.error(data.error ?? "An error occurred");
      }
    } finally {
      setPromoting(null);
    }
  }

  async function handleSubmit() {
    if (!form.userId || !form.belt || !form.examDate) {
      toast.error("Please fill in all required fields."); return;
    }
    const res = await fetch("/api/belt-rank", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, examScore: form.examScore ? Number(form.examScore) : undefined }),
    });
    if (res.ok) {
      toast.success("Belt exam registered successfully.");
      setShowDialog(false);
      runAfterOverlayTransition(() => fetchRecords());
    } else {
      const err = await res.json();
      toast.error(err.error || "An error occurred");
    }
  }

  async function updateResult(id: string, examResult: string) {
    await fetch(`/api/belt-rank/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examResult, promotedAt: examResult === "pass" ? new Date() : undefined }),
    });
    toast.success("Result updated successfully.");
    runAfterOverlayTransition(() => fetchRecords());
  }

  return (
    <DashboardLayout>
      <Header title="Belt & Rank" />
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex border border-slate-200 rounded-md p-0.5 gap-0.5">
            <button
              className={`px-3 py-1 rounded text-[13px] font-medium transition-colors ${tab === "history" ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setTab("history")}
            >
              <Award className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} />Exam History
            </button>
            <button
              className={`px-3 py-1 rounded text-[13px] font-medium transition-colors ${tab === "auto" ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setTab("auto")}
            >
              <Zap className="w-3.5 h-3.5 inline mr-1" strokeWidth={1.5} />Auto Promote
            </button>
          </div>
          <Button onClick={() => setShowDialog(true)} size="sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} /> Add Belt Exam
          </Button>
        </div>

        {tab === "auto" && (
          <div className="border border-slate-200 rounded-md">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200">
              <div>
                <h3 className="text-[13px] font-medium text-slate-800">Auto Promotion Candidates</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Based on attendance count and enrollment duration</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchAutoCandidates} className="h-7 text-xs gap-1">
                <RefreshCw className={`w-3 h-3 ${autoLoading ? "animate-spin" : ""}`} strokeWidth={1.5} /> Refresh
              </Button>
            </div>
            {autoLoading ? (
              <div className="text-center py-10 text-slate-400 text-[13px]">Analyzing...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="text-xs text-slate-500 font-medium h-8">Member</TableHead>
                    <TableHead className="text-xs text-slate-500 font-medium h-8">Current</TableHead>
                    <TableHead className="text-xs text-slate-500 font-medium h-8">Target</TableHead>
                    <TableHead className="text-xs text-slate-500 font-medium h-8">Attendance</TableHead>
                    <TableHead className="text-xs text-slate-500 font-medium h-8">Days</TableHead>
                    <TableHead className="text-xs text-slate-500 font-medium h-8">Status</TableHead>
                    <TableHead className="text-xs text-slate-500 font-medium h-8">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {autoCandidates.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400 text-[13px]">No eligible members found.</TableCell></TableRow>
                  ) : (
                    autoCandidates.map((c) => (
                      <TableRow key={c.memberId} className="border-b border-slate-100">
                        <TableCell className="text-[13px] font-medium py-2">{c.memberName}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${BELT_COLORS[c.currentBelt] ?? "bg-slate-300"}`} />
                            <span className="text-[13px]">{c.currentBeltLabel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1 text-[13px]">
                            <ChevronRight className="w-3 h-3 text-slate-300" strokeWidth={1.5} />
                            <span className={`w-2 h-2 rounded-full shrink-0 ${BELT_COLORS[c.nextBelt] ?? "bg-slate-300"}`} />
                            <span>{c.nextBeltLabel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className={`text-[13px] ${c.attendanceCount >= c.minAttendance ? "text-green-600 font-medium" : "text-slate-400"}`}>
                            {c.attendanceCount}
                          </span>
                          <span className="text-[11px] text-slate-400"> / {c.minAttendance}</span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className={`text-[13px] ${c.daysSince >= c.minDays ? "text-green-600 font-medium" : "text-slate-400"}`}>
                            {c.daysSince}
                          </span>
                          <span className="text-[11px] text-slate-400"> / {c.minDays}d</span>
                        </TableCell>
                        <TableCell className="py-2">
                          {c.isEligible
                            ? <span className="inline-flex items-center gap-1 text-green-600 text-[11px] font-medium"><CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />Eligible</span>
                            : <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]"><XCircle className="w-3 h-3" strokeWidth={1.5} />Not met</span>
                          }
                        </TableCell>
                        <TableCell className="py-2">
                          {c.isEligible && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[11px] px-2"
                              disabled={promoting === c.memberId}
                              onClick={() => handleAutoPromote(c.memberId)}
                            >
                              {promoting === c.memberId ? <RefreshCw className="w-3 h-3 animate-spin" strokeWidth={1.5} /> : "Promote"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="border border-slate-200 rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="text-xs text-slate-500 font-medium h-8">Member</TableHead>
                  <TableHead className="text-xs text-slate-500 font-medium h-8">Current</TableHead>
                  <TableHead className="text-xs text-slate-500 font-medium h-8">Exam Belt</TableHead>
                  <TableHead className="text-xs text-slate-500 font-medium h-8">Previous</TableHead>
                  <TableHead className="text-xs text-slate-500 font-medium h-8">Exam Date</TableHead>
                  <TableHead className="text-xs text-slate-500 font-medium h-8">Score</TableHead>
                  <TableHead className="text-xs text-slate-500 font-medium h-8">Result</TableHead>
                  <TableHead className="text-xs text-slate-500 font-medium h-8">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400 text-[13px]">
                    <Award className="w-5 h-5 mx-auto mb-1.5 text-slate-300" strokeWidth={1.5} />
                    No belt exam records found.
                  </TableCell></TableRow>
                ) : (
                  records.map((r) => (
                    <TableRow key={r._id} className="border-b border-slate-100">
                      <TableCell className="text-[13px] font-medium py-2">{r.userId?.name ?? "-"}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${BELT_COLORS[r.userId?.belt ?? "white"] ?? "bg-white border"}`} />
                          <span className="text-[13px]">{BELT_OPTIONS.find(b => b.value === r.userId?.belt)?.label ?? r.userId?.belt}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${BELT_COLORS[r.belt] ?? "bg-white border"}`} />
                          <span className="text-[13px]">{BELT_OPTIONS.find(b => b.value === r.belt)?.label ?? r.belt}</span>
                          <span className="text-[11px] text-slate-400">Dan {r.beltLevel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-500 py-2">
                        {r.previousBelt ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${BELT_COLORS[r.previousBelt] ?? "bg-white border"}`} />
                            <span>{BELT_OPTIONS.find(b => b.value === r.previousBelt)?.label ?? r.previousBelt}</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-500 py-2">{formatDate(r.examDate)}</TableCell>
                      <TableCell className="text-[13px] py-2">{r.examScore ?? "-"}</TableCell>
                      <TableCell className="py-2">
                        <Badge className={`rounded-md text-[11px] font-medium border ${RESULT_MAP[r.examResult]?.className ?? "border-slate-200 bg-slate-50 text-slate-600"}`} variant="outline">
                          {RESULT_MAP[r.examResult]?.label ?? r.examResult}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Select value={r.examResult} onValueChange={(v) => v !== null && updateResult(r._id, v)}>
                          <SelectTrigger className="h-7 w-24 text-[11px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="fail">Fail</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-[15px]">Add Belt Exam</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Member *</Label>
              <Select value={form.userId} onValueChange={(v) => v !== null && setForm({ ...form, userId: v })}>
                <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m._id} value={m._id}>{m.name} ({BELT_OPTIONS.find(b => b.value === m.belt)?.label ?? m.belt})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Target Belt *</Label>
                <Select value={form.belt} onValueChange={(v) => v !== null && setForm({ ...form, belt: v })}>
                  <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{BELT_OPTIONS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Dan Level</Label>
                <Input className="h-8 text-[13px]" type="number" min={1} max={10} value={form.beltLevel} onChange={(e) => setForm({ ...form, beltLevel: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Exam Date *</Label>
              <Input className="h-8 text-[13px]" type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Score</Label>
              <Input className="h-8 text-[13px]" type="number" value={form.examScore} onChange={(e) => setForm({ ...form, examScore: e.target.value })} placeholder="100" />
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
