"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Users, SlidersHorizontal, QrCode } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MemberQRCode } from "@/components/shared/MemberQRCode";

interface Member {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  belt?: string;
  beltLevel?: number;
  joinedAt: string;
  birthDate?: string;
}

const BELT_OPTIONS = [
  { value: "white", label: "흰띠", color: "bg-white border border-slate-200" },
  { value: "yellow", label: "노란띠", color: "bg-yellow-400" },
  { value: "orange", label: "주황띠", color: "bg-orange-400" },
  { value: "green", label: "초록띠", color: "bg-green-500" },
  { value: "blue", label: "파란띠", color: "bg-blue-500" },
  { value: "purple", label: "보라띠", color: "bg-purple-500" },
  { value: "red", label: "빨간띠", color: "bg-red-500" },
  { value: "brown", label: "갈색띠", color: "bg-amber-800" },
  { value: "black", label: "검정띠", color: "bg-slate-900" },
];

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  admin: { label: "관리자", className: "bg-violet-100 text-violet-700" },
  instructor: { label: "강사", className: "bg-blue-100 text-blue-700" },
  member: { label: "회원", className: "bg-slate-100 text-slate-600" },
  student: { label: "학생", className: "bg-emerald-100 text-emerald-700" },
};

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  active: { label: "활성", className: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  inactive: { label: "비활성", className: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
  pending: { label: "대기", className: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-500" },
};

const emptyForm = {
  name: "", email: "", password: "", phone: "", role: "member",
  belt: "white", beltLevel: 1, status: "active", birthDate: "", address: "", emergencyContact: "", notes: "",
};

function SkeletonRow() {
  return (
    <TableRow>
      {[...Array(8)].map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: i === 0 ? "120px" : i === 1 ? "160px" : "80px" }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

function MemberAvatar({ name, role }: { name: string; role: string }) {
  const initial = name.charAt(0);
  const colorMap: Record<string, string> = {
    admin: "bg-violet-100 text-violet-700",
    instructor: "bg-blue-100 text-blue-700",
    member: "bg-slate-100 text-slate-600",
    student: "bg-emerald-100 text-emerald-700",
  };
  const cls = colorMap[role] ?? "bg-slate-100 text-slate-600";
  return (
    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0", cls)}>
      {initial}
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [qrTarget, setQrTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    const res = await fetch(`/api/members?${params}`);
    const data = await res.json();
    setMembers(data.members ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, roleFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(member: Member) {
    setEditTarget(member);
    setForm({
      name: member.name, email: member.email, password: "",
      phone: member.phone || "", role: member.role, belt: member.belt || "white",
      beltLevel: member.beltLevel || 1, status: member.status,
      birthDate: member.birthDate ? member.birthDate.split("T")[0] : "",
      address: "", emergencyContact: "", notes: "",
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.email) {
      toast.error("이름과 이메일은 필수입니다.");
      return;
    }
    if (!editTarget && !form.password) {
      toast.error("비밀번호를 입력해주세요.");
      return;
    }

    const payload = { ...form };
    if (!payload.password) delete (payload as Record<string, unknown>).password;

    const res = editTarget
      ? await fetch(`/api/members/${editTarget._id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/members", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (res.ok) {
      toast.success(editTarget ? "회원 정보가 수정됐습니다." : "회원이 등록됐습니다.");
      setShowDialog(false);
      fetchMembers();
    } else {
      const err = await res.json();
      toast.error(err.error || "오류가 발생했습니다.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/members/${deleteTarget}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("회원이 삭제됐습니다.");
      setDeleteTarget(null);
      fetchMembers();
    }
  }

  function getBeltInfo(belt?: string) {
    return BELT_OPTIONS.find((b) => b.value === belt) ?? BELT_OPTIONS[0];
  }

  return (
    <DashboardLayout>
      <Header title="회원 관리" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* 상단 요약 바 */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">회원 목록</p>
              <p className="text-xs text-slate-400">총 {total}명</p>
            </div>
          </div>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            회원 등록
          </Button>
        </div>

        {/* 필터 바 */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="이름, 이메일, 전화번호..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <Select value={roleFilter || "all"} onValueChange={(v) => setRoleFilter(v === "all" ? "" : (v ?? ""))}>
            <SelectTrigger className="w-[110px] h-9 text-sm">
              <SelectValue placeholder="역할" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 역할</SelectItem>
              <SelectItem value="member">회원</SelectItem>
              <SelectItem value="student">학생</SelectItem>
              <SelectItem value="instructor">강사</SelectItem>
              <SelectItem value="admin">관리자</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 */}
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 pl-5">회원</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">연락처</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">역할</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">벨트</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">상태</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3">등록일</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 pr-5 text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-10 h-10 text-slate-200" />
                        <p className="text-sm font-medium text-slate-400">회원이 없습니다.</p>
                        <p className="text-xs text-slate-300">새 회원을 등록해보세요.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m) => {
                    const beltInfo = getBeltInfo(m.belt);
                    const roleConf = ROLE_CONFIG[m.role] ?? { label: m.role, className: "bg-slate-100 text-slate-600" };
                    const statusConf = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.inactive;
                    return (
                      <TableRow
                        key={m._id}
                        className="hover:bg-blue-50/30 transition-colors border-slate-100 group"
                      >
                        {/* 회원 정보 (아바타 + 이름/이메일) */}
                        <TableCell className="pl-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <MemberAvatar name={m.name} role={m.role} />
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{m.name}</p>
                              <p className="text-xs text-slate-400">{m.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">{m.phone || "-"}</TableCell>
                        <TableCell>
                          <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", roleConf.className)}>
                            {roleConf.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn("w-3 h-3 rounded-full shrink-0", beltInfo.color)} />
                            <span className="text-sm text-slate-600">{beltInfo.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full", statusConf.className)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusConf.dot)} />
                            {statusConf.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-400">
                          {new Date(m.joinedAt).toLocaleDateString("ko-KR")}
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                              title="QR 코드"
                              onClick={() => setQrTarget({ id: m._id, name: m.name })}
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => openEdit(m)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                              onClick={() => setDeleteTarget(m._id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
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

      {/* 등록/수정 다이얼로그 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editTarget ? "회원 정보 수정" : "새 회원 등록"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">이름 *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="홍길동" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">이메일 *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {editTarget ? "비밀번호 (변경 시만 입력)" : "비밀번호 *"}
              </Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">전화번호</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">생년월일</Label>
              <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">역할</Label>
              <Select value={form.role} onValueChange={(v) => v !== null && setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">학생</SelectItem>
                  <SelectItem value="member">회원</SelectItem>
                  <SelectItem value="instructor">강사</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">상태</Label>
              <Select value={form.status} onValueChange={(v) => v !== null && setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                  <SelectItem value="pending">대기</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">벨트</Label>
              <Select value={form.belt} onValueChange={(v) => v !== null && setForm({ ...form, belt: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BELT_OPTIONS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">벨트 레벨 (단)</Label>
              <Input
                type="number" min={1} max={10}
                value={form.beltLevel}
                onChange={(e) => setForm({ ...form, beltLevel: parseInt(e.target.value) || 1 })}
              />
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

      {/* QR 코드 다이얼로그 */}
      {qrTarget && (
        <MemberQRCode
          memberId={qrTarget.id}
          memberName={qrTarget.name}
          open={!!qrTarget}
          onClose={() => setQrTarget(null)}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">회원 삭제</DialogTitle>
          </DialogHeader>
          <div className="flex items-start gap-3 py-1">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">정말 삭제하시겠습니까?</p>
              <p className="text-xs text-slate-400 mt-1">삭제된 데이터는 복구할 수 없습니다.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
