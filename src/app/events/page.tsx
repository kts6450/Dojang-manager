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
import { Textarea } from "@/components/ui/textarea";
import { Plus, CalendarDays, MapPin, Users, Trash2, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EventItem {
  _id: string;
  title: string;
  description?: string;
  type: string;
  date: string;
  endDate?: string;
  location?: string;
  maxParticipants?: number;
  participants: { _id: string; name: string }[];
  status: string;
  fee?: number;
}

const TYPE_MAP: Record<string, string> = {
  competition: "대회", seminar: "세미나", exam: "심사", social: "행사", other: "기타",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  upcoming: { label: "예정", color: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  ongoing: { label: "진행중", color: "bg-green-100 text-green-700 hover:bg-green-100" },
  completed: { label: "완료", color: "bg-slate-100 text-slate-600 hover:bg-slate-100" },
  cancelled: { label: "취소", color: "bg-red-100 text-red-700 hover:bg-red-100" },
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", type: "other",
    date: new Date().toISOString().split("T")[0],
    endDate: "", location: "", maxParticipants: "", fee: "", notes: "",
  });

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/events");
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  async function handleSendEventEmail(eventId: string) {
    setSendingEmail(eventId);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "event", targetId: eventId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`이메일 발송 완료: ${data.sent}/${data.total}명`);
      } else {
        toast.error(data.error ?? "발송 실패");
      }
    } finally {
      setSendingEmail(null);
    }
  }

  async function handleSubmit() {
    if (!form.title || !form.date) { toast.error("제목과 날짜를 입력하세요."); return; }
    const res = await fetch("/api/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
        fee: form.fee ? Number(form.fee) : 0,
        endDate: form.endDate || undefined,
      }),
    });
    if (res.ok) {
      toast.success("이벤트가 등록됐습니다.");
      setShowDialog(false);
      setForm({ title: "", description: "", type: "other", date: new Date().toISOString().split("T")[0], endDate: "", location: "", maxParticipants: "", fee: "", notes: "" });
      fetchEvents();
    } else {
      const err = await res.json();
      toast.error(err.error || "오류 발생");
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/events/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("상태가 변경됐습니다.");
    fetchEvents();
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    toast.success("이벤트가 삭제됐습니다.");
    fetchEvents();
  }

  return (
    <DashboardLayout>
      <Header title="이벤트 관리" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">전체 {events.length}건</p>
          <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> 이벤트 등록
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-slate-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p>등록된 이벤트가 없습니다.</p>
            </div>
          ) : (
            events.map((event) => (
              <Card key={event._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-slate-800 leading-tight">
                      {event.title}
                    </CardTitle>
                    <Badge className={STATUS_MAP[event.status]?.color ?? ""}>{STATUS_MAP[event.status]?.label}</Badge>
                  </div>
                  <Badge variant="outline" className="w-fit text-xs mt-1">{TYPE_MAP[event.type] ?? event.type}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  {event.description && <p className="text-sm text-slate-500 line-clamp-2">{event.description}</p>}
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(event.date).toLocaleDateString("ko-KR")}</span>
                      {event.endDate && <span>~ {new Date(event.endDate).toLocaleDateString("ko-KR")}</span>}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>참가자 {event.participants?.length ?? 0}명 {event.maxParticipants ? `/ 최대 ${event.maxParticipants}명` : ""}</span>
                    </div>
                    {event.fee !== undefined && event.fee > 0 && (
                      <p className="text-xs text-slate-500">참가비: ₩{event.fee.toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => handleSendEventEmail(event._id)}
                      disabled={sendingEmail === event._id}
                      title="전체 회원에게 이메일 공지"
                    >
                      {sendingEmail === event._id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Mail className="w-3 h-3" />
                      }
                      공지
                    </Button>
                    <Select value={event.status} onValueChange={(v) => v !== null && updateStatus(event._id, v)}>
                      <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm" variant="ghost"
                      className="h-8 text-red-500 hover:bg-red-50"
                      onClick={() => deleteEvent(event._id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>이벤트 등록</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>제목 *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>종류</Label>
                <Select value={form.type} onValueChange={(v) => v !== null && setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>참가비 (원)</Label>
                <Input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>날짜 *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>종료일</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>장소</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>최대 인원</Label>
                <Input type="number" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>설명</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
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
