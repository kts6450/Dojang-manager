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
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, AlertTriangle, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "초안", color: "bg-slate-100 text-slate-600 hover:bg-slate-100" },
  pending: { label: "서명대기", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  signed: { label: "서명완료", color: "bg-green-100 text-green-700 hover:bg-green-100" },
  expired: { label: "만료", color: "bg-red-100 text-red-700 hover:bg-red-100" },
  cancelled: { label: "취소", color: "bg-slate-100 text-slate-500 hover:bg-slate-100" },
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    userId: "", title: "수강 계약서",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "", amount: "", terms: "본 계약은 수강 서비스 제공에 관한 사항을 규정합니다.", notes: "",
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
      toast.error("필수 항목을 입력하세요."); return;
    }
    const res = await fetch("/api/contracts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) || 0 }),
    });
    if (res.ok) {
      toast.success("계약서가 등록됐습니다.");
      setShowDialog(false);
      fetchContracts();
    } else {
      const err = await res.json();
      toast.error(err.error || "오류 발생");
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/contracts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("상태가 변경됐습니다.");
    fetchContracts();
  }

  return (
    <DashboardLayout>
      <Header title="계약서 관리" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {expiringSoon > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-sm text-orange-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>30일 이내 만료 예정 계약서가 <strong>{expiringSoon}건</strong> 있습니다.</span>
          </div>
        )}

        <div className="flex gap-3 items-center justify-between">
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : (v ?? ""))}>
            <SelectTrigger className="w-40"><SelectValue placeholder="전체 상태" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> 계약서 등록
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>회원</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>계약금액</TableHead>
                  <TableHead>시작일</TableHead>
                  <TableHead>만료일</TableHead>
                  <TableHead>서명일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>변경</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    계약서가 없습니다.
                  </TableCell></TableRow>
                ) : (
                  contracts.map((c) => (
                    <TableRow key={c._id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{c.userId?.name ?? "-"}</TableCell>
                      <TableCell>{c.title}</TableCell>
                      <TableCell>₩{c.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-slate-500">{new Date(c.startDate).toLocaleDateString("ko-KR")}</TableCell>
                      <TableCell className="text-sm text-slate-500">{new Date(c.endDate).toLocaleDateString("ko-KR")}</TableCell>
                      <TableCell className="text-sm text-slate-500">{c.signedAt ? new Date(c.signedAt).toLocaleDateString("ko-KR") : "-"}</TableCell>
                      <TableCell><Badge className={STATUS_MAP[c.status]?.color ?? ""}>{STATUS_MAP[c.status]?.label ?? c.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/contracts/${c._id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="상세 / 서명">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Select value={c.status} onValueChange={(v) => v !== null && updateStatus(c._id, v)}>
                            <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>계약서 등록</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>회원 *</Label>
              <Select value={form.userId} onValueChange={(v) => v !== null && setForm({ ...form, userId: v })}>
                <SelectTrigger><SelectValue placeholder="회원 선택" /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>제목 *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>시작일 *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>만료일 *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>계약금액 (원)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>계약 내용</Label>
              <Textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={4} />
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
