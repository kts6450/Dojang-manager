"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Award, Zap, CheckCircle2, XCircle, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
  { value: "white", label: "흰띠" },
  { value: "yellow", label: "노란띠" },
  { value: "orange", label: "주황띠" },
  { value: "green", label: "초록띠" },
  { value: "blue", label: "파란띠" },
  { value: "purple", label: "보라띠" },
  { value: "red", label: "빨간띠" },
  { value: "brown", label: "갈색띠" },
  { value: "black", label: "검정띠" },
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

const RESULT_MAP: Record<string, { label: string; color: string }> = {
  pass: { label: "합격", color: "bg-green-100 text-green-700 hover:bg-green-100" },
  fail: { label: "불합격", color: "bg-red-100 text-red-700 hover:bg-red-100" },
  pending: { label: "대기", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
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
        fetchAutoCandidates();
        fetchRecords();
      } else {
        toast.error(data.error ?? "오류 발생");
      }
    } finally {
      setPromoting(null);
    }
  }

  async function handleSubmit() {
    if (!form.userId || !form.belt || !form.examDate) {
      toast.error("필수 항목을 입력하세요."); return;
    }
    const res = await fetch("/api/belt-rank", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, examScore: form.examScore ? Number(form.examScore) : undefined }),
    });
    if (res.ok) {
      toast.success("승급 심사가 등록됐습니다.");
      setShowDialog(false);
      fetchRecords();
    } else {
      const err = await res.json();
      toast.error(err.error || "오류 발생");
    }
  }

  async function updateResult(id: string, examResult: string) {
    await fetch(`/api/belt-rank/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examResult, promotedAt: examResult === "pass" ? new Date() : undefined }),
    });
    toast.success("결과가 업데이트됐습니다.");
    fetchRecords();
  }

  return (
    <DashboardLayout>
      <Header title="승급 관리" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex justify-between items-center">
          {/* 탭 */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "history" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setTab("history")}
            >
              <Award className="w-3.5 h-3.5 inline mr-1.5" />심사 기록
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "auto" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setTab("auto")}
            >
              <Zap className="w-3.5 h-3.5 inline mr-1.5" />자동 승급
            </button>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> 승급 심사 등록
          </Button>
        </div>

        {/* 자동 승급 탭 */}
        {tab === "auto" && (
          <Card className="border-0 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">자동 승급 대상 조회</h3>
                <p className="text-xs text-slate-400 mt-0.5">출석 횟수 및 재적 기간 기준으로 승급 가능 여부를 판단합니다.</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchAutoCandidates} className="gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${autoLoading ? "animate-spin" : ""}`} /> 새로고침
              </Button>
            </div>
            <CardContent className="p-0">
              {autoLoading ? (
                <div className="text-center py-12 text-slate-400 text-sm">분석 중...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>회원</TableHead>
                      <TableHead>현재 벨트</TableHead>
                      <TableHead>승급 목표</TableHead>
                      <TableHead>출석 횟수</TableHead>
                      <TableHead>재적 일수</TableHead>
                      <TableHead>승급 가능</TableHead>
                      <TableHead>처리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {autoCandidates.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400">대상 회원이 없습니다.</TableCell></TableRow>
                    ) : (
                      autoCandidates.map((c) => (
                        <TableRow key={c.memberId} className={c.isEligible ? "bg-emerald-50/40" : ""}>
                          <TableCell className="font-medium">{c.memberName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${BELT_COLORS[c.currentBelt] ?? "bg-slate-300"}`} />
                              {c.currentBeltLabel}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              <span className={`w-2.5 h-2.5 rounded-full ${BELT_COLORS[c.nextBelt] ?? "bg-slate-300"}`} />
                              {c.nextBeltLabel}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={c.attendanceCount >= c.minAttendance ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                              {c.attendanceCount}
                            </span>
                            <span className="text-slate-400 text-xs"> / {c.minAttendance}</span>
                          </TableCell>
                          <TableCell>
                            <span className={c.daysSince >= c.minDays ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                              {c.daysSince}
                            </span>
                            <span className="text-slate-400 text-xs"> / {c.minDays}일</span>
                          </TableCell>
                          <TableCell>
                            {c.isEligible
                              ? <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm"><CheckCircle2 className="w-4 h-4" />가능</span>
                              : <span className="inline-flex items-center gap-1 text-slate-400 text-sm"><XCircle className="w-4 h-4" />미충족</span>
                            }
                          </TableCell>
                          <TableCell>
                            {c.isEligible && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                                disabled={promoting === c.memberId}
                                onClick={() => handleAutoPromote(c.memberId)}
                              >
                                {promoting === c.memberId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "승급 처리"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* 심사 기록 탭 */}
        {tab === "history" && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>회원</TableHead>
                  <TableHead>현재 벨트</TableHead>
                  <TableHead>심사 벨트</TableHead>
                  <TableHead>이전 벨트</TableHead>
                  <TableHead>심사일</TableHead>
                  <TableHead>점수</TableHead>
                  <TableHead>결과</TableHead>
                  <TableHead>결과 변경</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-400">
                    <Award className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    승급 기록이 없습니다.
                  </TableCell></TableRow>
                ) : (
                  records.map((r) => (
                    <TableRow key={r._id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{r.userId?.name ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-3 h-3 rounded-full ${BELT_COLORS[r.userId?.belt ?? "white"] ?? "bg-white border"}`} />
                          <span className="text-sm">{BELT_OPTIONS.find(b => b.value === r.userId?.belt)?.label ?? r.userId?.belt}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-3 h-3 rounded-full ${BELT_COLORS[r.belt] ?? "bg-white border"}`} />
                          <span className="text-sm">{BELT_OPTIONS.find(b => b.value === r.belt)?.label ?? r.belt} {r.beltLevel}단</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {BELT_OPTIONS.find(b => b.value === r.previousBelt)?.label ?? r.previousBelt ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{new Date(r.examDate).toLocaleDateString("ko-KR")}</TableCell>
                      <TableCell className="text-sm">{r.examScore ?? "-"}</TableCell>
                      <TableCell>
                        <Badge className={RESULT_MAP[r.examResult]?.color ?? ""}>
                          {RESULT_MAP[r.examResult]?.label ?? r.examResult}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={r.examResult} onValueChange={(v) => v !== null && updateResult(r._id, v)}>
                          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">대기</SelectItem>
                            <SelectItem value="pass">합격</SelectItem>
                            <SelectItem value="fail">불합격</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>승급 심사 등록</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>회원 *</Label>
              <Select value={form.userId} onValueChange={(v) => v !== null && setForm({ ...form, userId: v })}>
                <SelectTrigger><SelectValue placeholder="회원 선택" /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m._id} value={m._id}>{m.name} ({BELT_OPTIONS.find(b => b.value === m.belt)?.label ?? m.belt})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>승급 벨트 *</Label>
                <Select value={form.belt} onValueChange={(v) => v !== null && setForm({ ...form, belt: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BELT_OPTIONS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>단수</Label>
                <Input type="number" min={1} max={10} value={form.beltLevel} onChange={(e) => setForm({ ...form, beltLevel: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>심사일 *</Label>
              <Input type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>점수</Label>
              <Input type="number" value={form.examScore} onChange={(e) => setForm({ ...form, examScore: e.target.value })} placeholder="100" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>취소</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
