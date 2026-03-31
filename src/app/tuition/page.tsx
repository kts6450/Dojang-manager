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
import { Plus, CreditCard, AlertCircle, CheckCircle, Clock, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
        toast.success(`연체 알림 발송: ${data.sent}/${data.total}명`);
      } else {
        toast.error(data.error ?? "발송 실패");
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
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
      연체 알림 발송
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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "미납", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  paid: { label: "납부완료", color: "bg-green-100 text-green-700 hover:bg-green-100" },
  overdue: { label: "연체", color: "bg-red-100 text-red-700 hover:bg-red-100" },
  cancelled: { label: "취소", color: "bg-slate-100 text-slate-600 hover:bg-slate-100" },
};

export default function TuitionPage() {
  const [items, setItems] = useState<TuitionItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [summary, setSummary] = useState<{ paid: number; pending: number; overdue: number }>({ paid: 0, pending: 0, overdue: 0 });
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    userId: "", amount: "", description: "월 수강료",
    dueDate: new Date().toISOString().split("T")[0], notes: "",
  });

  const fetchItems = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/tuition?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    // total is displayed via items.length

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
      toast.error("필수 항목을 입력해주세요."); return;
    }
    const res = await fetch("/api/tuition", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    if (res.ok) {
      toast.success("수강료가 등록됐습니다.");
      setShowDialog(false);
      setForm({ userId: "", amount: "", description: "월 수강료", dueDate: new Date().toISOString().split("T")[0], notes: "" });
      fetchItems();
    } else {
      const err = await res.json();
      toast.error(err.error || "오류 발생");
    }
  }

  async function markPaid(id: string) {
    await fetch(`/api/tuition/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid", paymentMethod: "현금", paidAt: new Date() }),
    });
    toast.success("납부 처리됐습니다.");
    fetchItems();
  }

  const totalAmount = items.reduce((sum, i) => i.status === "paid" ? sum + i.amount : sum, 0);

  return (
    <DashboardLayout>
      <Header title="수강료 관리" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "납부완료", value: summary.paid, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
            { label: "미납", value: summary.pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "연체", value: summary.overdue, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
            { label: "이번달 수입", value: `₩${totalAmount.toLocaleString()}`, icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`${bg} p-2.5 rounded-lg`}><Icon className={`w-5 h-5 ${color}`} /></div>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-xl font-bold text-slate-800">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 items-center justify-between flex-wrap">
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : (v ?? ""))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">미납</SelectItem>
              <SelectItem value="paid">납부완료</SelectItem>
              <SelectItem value="overdue">연체</SelectItem>
              <SelectItem value="cancelled">취소</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <OverdueEmailButton />
            <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> 수강료 등록
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>회원</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>납부기한</TableHead>
                  <TableHead>납부일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>처리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-400">데이터가 없습니다.</TableCell></TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item._id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{item.userId?.name ?? "-"}</TableCell>
                      <TableCell className="text-sm text-slate-500">{item.userId?.phone ?? "-"}</TableCell>
                      <TableCell className="text-sm">{item.description}</TableCell>
                      <TableCell className="font-medium">₩{item.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-slate-500">{new Date(item.dueDate).toLocaleDateString("ko-KR")}</TableCell>
                      <TableCell className="text-sm text-slate-500">{item.paidAt ? new Date(item.paidAt).toLocaleDateString("ko-KR") : "-"}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_MAP[item.status]?.color ?? ""}>{STATUS_MAP[item.status]?.label ?? item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.status !== "paid" && item.status !== "cancelled" && (
                          <Button size="sm" variant="outline" onClick={() => markPaid(item._id)} className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50">
                            납부처리
                          </Button>
                        )}
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
          <DialogHeader><DialogTitle>수강료 등록</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>회원 *</Label>
              <Select value={form.userId} onValueChange={(v) => v !== null && setForm({ ...form, userId: v })}>
                <SelectTrigger><SelectValue placeholder="회원 선택" /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>설명</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>금액 (원) *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="120000" />
            </div>
            <div className="space-y-1.5">
              <Label>납부기한 *</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
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
