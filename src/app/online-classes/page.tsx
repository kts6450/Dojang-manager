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
import { Plus, BookOpen, ExternalLink, Clock, Trash2, Copy, Video } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, runAfterOverlayTransition } from "@/lib/utils";

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

const PLATFORM_MAP: Record<string, { label: string }> = {
  zoom: { label: "Zoom" },
  meet: { label: "Google Meet" },
  teams: { label: "Teams" },
  youtube: { label: "YouTube" },
  other: { label: "Other" },
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-blue-50 text-blue-700 border-blue-200" },
  ongoing:   { label: "In Progress", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed: { label: "Completed", className: "bg-slate-50 text-slate-600 border-slate-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600 border-red-200" },
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
      toast.error("Title, link, and schedule are required."); return;
    }
    const res = await fetch("/api/online-classes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, duration: Number(form.duration) }),
    });
    if (res.ok) {
      toast.success("Online class has been created.");
      setShowDialog(false);
      setForm({ title: "", description: "", platform: "zoom", meetingUrl: "", meetingId: "", passcode: "", scheduledAt: new Date().toISOString().slice(0, 16), duration: "60", notes: "" });
      runAfterOverlayTransition(() => fetchClasses());
    } else {
      const err = await res.json();
      toast.error(err.error || "An error occurred");
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/online-classes/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("Status has been updated.");
    runAfterOverlayTransition(() => fetchClasses());
  }

  async function deleteClass(id: string) {
    await fetch(`/api/online-classes/${id}`, { method: "DELETE" });
    toast.success("Class has been deleted.");
    runAfterOverlayTransition(() => fetchClasses());
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("Link has been copied.");
  }

  return (
    <DashboardLayout>
      <Header title="Online Classes" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              <span className="text-[13px] text-slate-500">Total {classes.length} classes</span>
            </div>
            <Button onClick={() => setShowDialog(true)} size="sm" className="h-8 gap-1.5 text-[13px]">
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} /> Add Class
            </Button>
          </div>

          {classes.length === 0 ? (
            <div className="border border-slate-200 rounded-md py-16 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
              <p className="text-[13px] text-slate-400">No online classes found.</p>
            </div>
          ) : (
            <Card className="border-slate-200 overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60">
                      {["Class", "Platform", "Instructor", "Schedule", "Duration", "Meeting Info", "Status", ""].map((h) => (
                        <th key={h} className="text-left text-xs font-medium text-slate-500 py-2 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => {
                      const platform = PLATFORM_MAP[cls.platform] ?? { label: cls.platform };
                      const statusConf = STATUS_MAP[cls.status] ?? STATUS_MAP.scheduled;
                      return (
                        <tr key={cls._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                          <td className="px-3 py-2">
                            <p className="text-[13px] font-medium text-slate-700">{cls.title}</p>
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-[11px] font-medium text-slate-600 border border-slate-200 rounded-md px-1.5 py-0.5">
                              {platform.label}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[13px] text-slate-500">{cls.instructor?.name ?? "-"}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
                              <span className="text-[13px] text-slate-600">
                                {formatDate(cls.scheduledAt)}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {new Date(cls.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[13px] text-slate-500 tabular-nums">{cls.duration} min</td>
                          <td className="px-3 py-2">
                            {cls.meetingId && (
                              <p className="text-[11px] text-slate-400">
                                ID: {cls.meetingId}{cls.passcode ? ` / PW: ${cls.passcode}` : ""}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <Select value={cls.status} onValueChange={(v) => v !== null && updateStatus(cls._id, v)}>
                              <SelectTrigger className={cn("h-7 w-[110px] text-[11px] font-medium border rounded-md", statusConf.className)}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                                onClick={() => window.open(cls.meetingUrl, "_blank")}>
                                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                                onClick={() => copyLink(cls.meetingUrl)}>
                                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                                onClick={() => deleteClass(cls._id)}>
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[13px] font-semibold">Add Online Class</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-500">Class Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-8 text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Platform</Label>
                <Select value={form.platform} onValueChange={(v) => v !== null && setForm({ ...form, platform: v })}>
                  <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Duration (min)</Label>
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="h-8 text-[13px]" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-500">Meeting Link *</Label>
              <Input value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} placeholder="https://zoom.us/j/..." className="h-8 text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Meeting ID</Label>
                <Input value={form.meetingId} onChange={(e) => setForm({ ...form, meetingId: e.target.value })} className="h-8 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">Passcode</Label>
                <Input value={form.passcode} onChange={(e) => setForm({ ...form, passcode: e.target.value })} className="h-8 text-[13px]" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-500">Date & Time *</Label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="h-8 text-[13px]" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
