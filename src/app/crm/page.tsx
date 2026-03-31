"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2, Pencil, PhoneCall, Users, TrendingUp, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  status: string;
  interestedIn?: string;
  trialDate?: string;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  new:       { label: "신규",     color: "text-blue-700",    dot: "bg-blue-500",    bg: "bg-blue-50" },
  contacted: { label: "연락완료", color: "text-purple-700",  dot: "bg-purple-500",  bg: "bg-purple-50" },
  trial:     { label: "체험중",   color: "text-yellow-700",  dot: "bg-yellow-500",  bg: "bg-yellow-50" },
  converted: { label: "회원전환", color: "text-emerald-700", dot: "bg-emerald-500", bg: "bg-emerald-50" },
  lost:      { label: "이탈",     color: "text-red-500",     dot: "bg-red-400",     bg: "bg-red-50" },
};

const SOURCE_CONFIG: Record<string, { label: string; icon: string }> = {
  "walk-in":  { label: "방문",    icon: "🚪" },
  referral:   { label: "소개",    icon: "👥" },
  sns:        { label: "SNS",     icon: "📱" },
  website:    { label: "웹사이트", icon: "🌐" },
  event:      { label: "이벤트",  icon: "🎉" },
  other:      { label: "기타",    icon: "📌" },
};

const KANBAN_COLUMNS = ["new", "contacted", "trial", "converted", "lost"] as const;

const emptyForm = {
  name: "", email: "", phone: "", source: "walk-in", status: "new",
  interestedIn: "", trialDate: "", notes: "", followUpDate: "",
};

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    const statsMap: Record<string, number> = {};
    (data.stats ?? []).forEach((s: { _id: string; count: number }) => { statsMap[s._id] = s.count; });
    setStats(statsMap);
  }, [search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(lead: Lead) {
    setEditTarget(lead);
    setForm({
      name: lead.name, email: lead.email ?? "", phone: lead.phone ?? "",
      source: lead.source, status: lead.status, interestedIn: lead.interestedIn ?? "",
      trialDate: lead.trialDate ? lead.trialDate.split("T")[0] : "",
      notes: lead.notes ?? "",
      followUpDate: lead.followUpDate ? lead.followUpDate.split("T")[0] : "",
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!form.name) { toast.error("이름은 필수입니다."); return; }
    const res = editTarget
      ? await fetch(`/api/leads/${editTarget._id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch("/api/leads", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

    if (res.ok) {
      toast.success(editTarget ? "리드 정보가 수정됐습니다." : "리드가 등록됐습니다.");
      setShowDialog(false);
      fetchLeads();
    } else {
      toast.error("오류가 발생했습니다.");
    }
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("상태가 변경됐습니다.");
    fetchLeads();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    toast.success("삭제됐습니다.");
    fetchLeads();
  }

  const totalLeads = Object.values(stats).reduce((a, b) => a + b, 0);
  const conversionRate = totalLeads > 0
    ? Math.round(((stats.converted ?? 0) / totalLeads) * 100)
    : 0;

  return (
    <DashboardLayout>
      <Header title="CRM / 리드 관리" />
      <div className="flex-1 overflow-y-auto bg-slate-50/60">
        <div className="p-6 space-y-5 max-w-[1400px] mx-auto">

          {/* 상단 요약 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "전체 리드", value: totalLeads, icon: Users, gradient: "from-blue-500 to-blue-600" },
              { label: "체험 중", value: stats.trial ?? 0, icon: PhoneCall, gradient: "from-yellow-500 to-orange-500" },
              { label: "회원 전환", value: stats.converted ?? 0, icon: UserCheck, gradient: "from-emerald-500 to-emerald-600" },
              { label: "전환율", value: `${conversionRate}%`, icon: TrendingUp, gradient: "from-violet-500 to-violet-600" },
            ].map(({ label, value, icon: Icon, gradient }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
                <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-black text-slate-800">{value}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* 컨트롤 바 */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 items-center flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="이름, 연락처 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
              </div>
              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-32 h-9 text-sm"><SelectValue placeholder="전체" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {/* 뷰 토글 */}
              <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                {(["kanban", "list"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-all", view === v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                    {v === "kanban" ? "칸반" : "목록"}
                  </button>
                ))}
              </div>
              <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="w-4 h-4" /> 리드 등록
              </Button>
            </div>
          </div>

          {/* 칸반 뷰 */}
          {view === "kanban" && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {KANBAN_COLUMNS.map((col) => {
                const colConf = STATUS_CONFIG[col];
                const colLeads = leads.filter((l) => l.status === col);
                return (
                  <div key={col} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className={cn("px-4 py-3 border-b border-slate-100", colConf.bg)}>
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", colConf.dot)} />
                        <span className={cn("text-xs font-bold", colConf.color)}>{colConf.label}</span>
                        <span className="ml-auto text-xs font-black text-slate-500">{colLeads.length}</span>
                      </div>
                    </div>
                    <div className="p-2 space-y-2 min-h-[120px]">
                      {colLeads.length === 0 ? (
                        <div className="py-6 text-center">
                          <UserX className="w-6 h-6 text-slate-200 mx-auto" />
                        </div>
                      ) : (
                        colLeads.map((lead) => (
                          <div key={lead._id}
                            className="bg-slate-50 hover:bg-blue-50/50 rounded-xl p-3 transition-all cursor-pointer group border border-transparent hover:border-blue-100"
                            onClick={() => openEdit(lead)}
                          >
                            <p className="text-sm font-semibold text-slate-700 truncate">{lead.name}</p>
                            {lead.phone && <p className="text-xs text-slate-400 mt-0.5">{lead.phone}</p>}
                            {lead.interestedIn && (
                              <p className="text-xs text-blue-500 mt-1 truncate">{lead.interestedIn}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-slate-400">
                                {SOURCE_CONFIG[lead.source]?.icon} {SOURCE_CONFIG[lead.source]?.label}
                              </span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {col !== "converted" && (
                                  <button
                                    className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold hover:bg-emerald-100"
                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(lead._id, KANBAN_COLUMNS[KANBAN_COLUMNS.indexOf(col) + 1] ?? "converted"); }}
                                  >
                                    다음 →
                                  </button>
                                )}
                                <button
                                  className="text-[10px] text-red-400 hover:text-red-600"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(lead._id); }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 목록 뷰 */}
          {view === "list" && (
            <Card className="border-slate-100 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["이름", "연락처", "유입경로", "관심사항", "팔로업 날짜", "상태", "등록일", "관리"].map((h) => (
                        <th key={h} className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leads.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">리드가 없습니다.</td></tr>
                    ) : (
                      leads.map((lead) => {
                        const stConf = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
                        return (
                          <tr key={lead._id} className="hover:bg-blue-50/20 transition-colors group">
                            <td className="px-4 py-3.5">
                              <p className="text-sm font-semibold text-slate-700">{lead.name}</p>
                              {lead.email && <p className="text-xs text-slate-400">{lead.email}</p>}
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-500">{lead.phone ?? "-"}</td>
                            <td className="px-4 py-3.5 text-sm">
                              <span className="text-slate-500">
                                {SOURCE_CONFIG[lead.source]?.icon} {SOURCE_CONFIG[lead.source]?.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-500 max-w-[140px] truncate">{lead.interestedIn ?? "-"}</td>
                            <td className="px-4 py-3.5 text-sm text-slate-500">
                              {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString("ko-KR") : "-"}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full", stConf.bg, stConf.color)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", stConf.dot)} />
                                {stConf.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-400">
                              {new Date(lead.createdAt).toLocaleDateString("ko-KR")}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => openEdit(lead)}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDelete(lead._id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 리드 등록/수정 다이얼로그 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{editTarget ? "리드 수정" : "신규 리드 등록"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">이름 *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="홍길동" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">연락처</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">이메일</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">유입경로</Label>
                <Select value={form.source} onValueChange={(v) => v && setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">상태</Label>
                <Select value={form.status} onValueChange={(v) => v && setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">관심 프로그램</Label>
                <Input value={form.interestedIn} onChange={(e) => setForm({ ...form, interestedIn: e.target.value })} placeholder="태권도, 유아체육 등" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">체험 날짜</Label>
                <Input type="date" value={form.trialDate} onChange={(e) => setForm({ ...form, trialDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">팔로업 날짜</Label>
                <Input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">메모</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="상담 내용, 특이사항 등" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>취소</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              {editTarget ? "수정 완료" : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
