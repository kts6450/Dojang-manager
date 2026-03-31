"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen, ExternalLink, Clock, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

interface OnlineClass {
  _id: string;
  title: string;
  description?: string;
  instructor: { _id: string; name: string };
  platform: string;
  meetingUrl: string;
  meetingId?: string;
  passcode?: string;
  scheduledAt: string;
  duration: number;
  status: string;
  participants: { _id: string; name: string }[];
}

const PLATFORM_MAP: Record<string, { label: string; color: string }> = {
  zoom: { label: "Zoom", color: "bg-blue-600" },
  meet: { label: "Google Meet", color: "bg-green-600" },
  teams: { label: "Teams", color: "bg-purple-600" },
  youtube: { label: "YouTube", color: "bg-red-600" },
  other: { label: "기타", color: "bg-slate-600" },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  scheduled: { label: "예정", color: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  ongoing: { label: "진행중", color: "bg-green-100 text-green-700 hover:bg-green-100" },
  completed: { label: "완료", color: "bg-slate-100 text-slate-600 hover:bg-slate-100" },
  cancelled: { label: "취소", color: "bg-red-100 text-red-700 hover:bg-red-100" },
};

export default function OnlineClassesPage() {
  const [classes, setClasses] = useState<OnlineClass[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", platform: "zoom",
    meetingUrl: "", meetingId: "", passcode: "",
    scheduledAt: new Date().toISOString().slice(0, 16),
    duration: "60", notes: "",
  });

  const fetchClasses = useCallback(async () => {
    const res = await fetch("/api/online-classes");
    const data = await res.json();
    setClasses(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  async function handleSubmit() {
    if (!form.title || !form.meetingUrl || !form.scheduledAt) {
      toast.error("제목, 링크, 일정은 필수입니다."); return;
    }
    const res = await fetch("/api/online-classes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, duration: Number(form.duration) }),
    });
    if (res.ok) {
      toast.success("온라인 수업이 등록됐습니다.");
      setShowDialog(false);
      setForm({ title: "", description: "", platform: "zoom", meetingUrl: "", meetingId: "", passcode: "", scheduledAt: new Date().toISOString().slice(0, 16), duration: "60", notes: "" });
      fetchClasses();
    } else {
      const err = await res.json();
      toast.error(err.error || "오류 발생");
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/online-classes/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("상태가 변경됐습니다.");
    fetchClasses();
  }

  async function deleteClass(id: string) {
    await fetch(`/api/online-classes/${id}`, { method: "DELETE" });
    toast.success("수업이 삭제됐습니다.");
    fetchClasses();
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("링크가 복사됐습니다.");
  }

  return (
    <DashboardLayout>
      <Header title="온라인 수업" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">전체 {classes.length}건</p>
          <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> 수업 등록
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p>등록된 온라인 수업이 없습니다.</p>
            </div>
          ) : (
            classes.map((cls) => {
              const platform = PLATFORM_MAP[cls.platform] ?? { label: cls.platform, color: "bg-slate-600" };
              return (
                <Card key={cls._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold text-slate-800">{cls.title}</CardTitle>
                      <Badge className={STATUS_MAP[cls.status]?.color ?? ""}>{STATUS_MAP[cls.status]?.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs text-white px-2 py-0.5 rounded-full ${platform.color}`}>{platform.label}</span>
                      <span className="text-xs text-slate-500">강사: {cls.instructor?.name ?? "-"}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(cls.scheduledAt).toLocaleDateString("ko-KR")} {new Date(cls.scheduledAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-slate-400">({cls.duration}분)</span>
                      </div>
                      {cls.meetingId && <p className="text-xs text-slate-400">ID: {cls.meetingId} {cls.passcode ? `/ PW: ${cls.passcode}` : ""}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm" variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => window.open(cls.meetingUrl, "_blank")}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> 참여
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => copyLink(cls.meetingUrl)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Select value={cls.status} onValueChange={(v) => v !== null && updateStatus(cls._id, v)}>
                        <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:bg-red-50" onClick={() => deleteClass(cls._id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>온라인 수업 등록</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>수업 제목 *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>플랫폼</Label>
                <Select value={form.platform} onValueChange={(v) => v !== null && setForm({ ...form, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>시간 (분)</Label>
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>참여 링크 *</Label>
              <Input value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} placeholder="https://zoom.us/j/..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>미팅 ID</Label>
                <Input value={form.meetingId} onChange={(e) => setForm({ ...form, meetingId: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>비밀번호</Label>
                <Input value={form.passcode} onChange={(e) => setForm({ ...form, passcode: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>수업 일시 *</Label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
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
