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
import { Plus, GraduationCap } from "lucide-react";
import { toast } from "sonner";

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

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "수강중", color: "bg-green-100 text-green-700 hover:bg-green-100" },
  inactive: { label: "중단", color: "bg-slate-100 text-slate-600 hover:bg-slate-100" },
  completed: { label: "수료", color: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
};

export default function AfterSchoolPage() {
  const [records, setRecords] = useState<AfterSchoolRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    studentId: "", programName: "방과후 태권도",
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
      toast.error("필수 항목을 입력하세요."); return;
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
      toast.success("방과후 등록됐습니다.");
      setShowDialog(false);
      fetchRecords();
    } else {
      const err = await res.json();
      toast.error(err.error || "오류 발생");
    }
  }

  return (
    <DashboardLayout>
      <Header title="방과후 관리" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">전체 {records.length}명</p>
          <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> 방과후 등록
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>학생</TableHead>
                  <TableHead>프로그램</TableHead>
                  <TableHead>수업 요일</TableHead>
                  <TableHead>시간</TableHead>
                  <TableHead>시작일</TableHead>
                  <TableHead>수강료</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    방과후 수강생이 없습니다.
                  </TableCell></TableRow>
                ) : (
                  records.map((r) => (
                    <TableRow key={r._id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{r.studentId?.name ?? "-"}</TableCell>
                      <TableCell>{r.programName}</TableCell>
                      <TableCell className="text-sm">
                        {r.schedule?.dayOfWeek?.map(d => DAY_NAMES[d]).join(", ") ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {r.schedule?.startTime} ~ {r.schedule?.endTime}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{new Date(r.startDate).toLocaleDateString("ko-KR")}</TableCell>
                      <TableCell className="text-sm">{r.tuitionAmount ? `₩${r.tuitionAmount.toLocaleString()}` : "-"}</TableCell>
                      <TableCell><Badge className={STATUS_MAP[r.status]?.color ?? ""}>{STATUS_MAP[r.status]?.label ?? r.status}</Badge></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>방과후 등록</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>학생 *</Label>
              <Select value={form.studentId} onValueChange={(v) => v !== null && setForm({ ...form, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="학생 선택" /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>프로그램명 *</Label>
              <Input value={form.programName} onChange={(e) => setForm({ ...form, programName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>수업 요일</Label>
              <div className="flex gap-1.5">
                {DAY_NAMES.map((name, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                      form.dayOfWeek.includes(i)
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>시작 시간</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>종료 시간</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>시작일 *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>월 수강료</Label>
                <Input type="number" value={form.tuitionAmount} onChange={(e) => setForm({ ...form, tuitionAmount: e.target.value })} />
              </div>
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
