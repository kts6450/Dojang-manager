"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CalendarCheck, UserCheck, UserX, Clock, QrCode } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  present: { label: "출석", color: "bg-green-100 text-green-700 hover:bg-green-100" },
  absent: { label: "결석", color: "bg-red-100 text-red-700 hover:bg-red-100" },
  late: { label: "지각", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  excused: { label: "공결", color: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
};

const CLASS_TYPES = ["태권도", "합기도", "유도", "검도", "권투", "방과후", "기타"];

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, excused: 0 });
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    userId: "", classType: "태권도", date: new Date().toISOString().split("T")[0],
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
    if (!form.userId) { toast.error("회원을 선택하세요."); return; }
    const res = await fetch("/api/attendance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("출결이 등록됐습니다.");
      setShowDialog(false);
      fetchRecords();
    } else {
      const err = await res.json();
      toast.error(err.error || "오류 발생");
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/attendance/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("상태가 변경됐습니다.");
    fetchRecords();
  }

  const statCards = [
    { label: "출석", value: stats.present, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { label: "결석", value: stats.absent, icon: UserX, color: "text-red-600", bg: "bg-red-50" },
    { label: "지각", value: stats.late, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "공결", value: stats.excused, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <DashboardLayout>
      <Header title="출결 관리" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 items-center">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
            <span className="text-slate-400">~</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          </div>
          <div className="flex gap-2">
            <Link href="/attendance/qr-scan">
              <Button variant="outline" className="gap-2 border-violet-200 text-violet-600 hover:bg-violet-50">
                <QrCode className="w-4 h-4" /> QR 체크인
              </Button>
            </Link>
            <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> 출결 등록
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`${bg} p-2.5 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-2xl font-bold text-slate-800">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-700">출결 기록 ({total}건)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>회원</TableHead>
                  <TableHead>수업</TableHead>
                  <TableHead>날짜</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>체크 방식</TableHead>
                  <TableHead>상태 변경</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                      출결 기록이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((r) => (
                    <TableRow key={r._id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{r.userId?.name ?? "-"}</TableCell>
                      <TableCell>{r.classType}</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(r.date).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_MAP[r.status]?.color ?? ""}>
                          {STATUS_MAP[r.status]?.label ?? r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {r.method === "qr" ? "QR" : "수동"}
                      </TableCell>
                      <TableCell>
                        <Select value={r.status} onValueChange={(v) => v !== null && updateStatus(r._id, v)}>
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">출석</SelectItem>
                            <SelectItem value="absent">결석</SelectItem>
                            <SelectItem value="late">지각</SelectItem>
                            <SelectItem value="excused">공결</SelectItem>
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
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>출결 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>회원 *</Label>
              <Select value={form.userId} onValueChange={(v) => v !== null && setForm({ ...form, userId: v })}>
                <SelectTrigger><SelectValue placeholder="회원 선택" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>수업 종류 *</Label>
              <Select value={form.classType} onValueChange={(v) => v !== null && setForm({ ...form, classType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASS_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>날짜 *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>상태</Label>
              <Select value={form.status} onValueChange={(v) => v !== null && setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">출석</SelectItem>
                  <SelectItem value="absent">결석</SelectItem>
                  <SelectItem value="late">지각</SelectItem>
                  <SelectItem value="excused">공결</SelectItem>
                </SelectContent>
              </Select>
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
