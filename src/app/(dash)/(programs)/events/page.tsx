"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CalendarDays, MapPin, Users, Trash2, Mail, Loader2, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatCurrency, runAfterOverlayTransition } from "@/lib/utils";

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
  competition: "Competition", seminar: "Seminar", exam: "Exam", social: "Social", other: "Other",
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "border-blue-200 bg-blue-50 text-blue-600" },
  ongoing: { label: "In Progress", className: "border-green-200 bg-green-50 text-green-600" },
  completed: { label: "Completed", className: "border-slate-200 bg-slate-50 text-slate-500" },
  cancelled: { label: "Cancelled", className: "border-red-200 bg-red-50 text-red-600" },
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [participantsDialog, setParticipantsDialog] = useState<EventItem | null>(null);
  const [joinMemberId, setJoinMemberId] = useState("");
  const [memberSearch, setMemberSearch] = useState<{ _id: string; name: string }[]>([]);
  const [joiningEvent, setJoiningEvent] = useState(false);
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
        toast.success(`Email sent: ${data.sent}/${data.total} recipients`);
      } else {
        toast.error(data.error ?? "Failed to send");
      }
    } finally {
      setSendingEmail(null);
    }
  }

  async function handleSubmit() {
    if (!form.title || !form.date) { toast.error("Please enter a title and date."); return; }
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
      toast.success("Event has been created.");
      setShowDialog(false);
      setForm({ title: "", description: "", type: "other", date: new Date().toISOString().split("T")[0], endDate: "", location: "", maxParticipants: "", fee: "", notes: "" });
      runAfterOverlayTransition(() => fetchEvents());
    } else {
      const err = await res.json();
      toast.error(err.error || "An error occurred");
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/events/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("Status has been updated.");
    runAfterOverlayTransition(() => fetchEvents());
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    toast.success("Event has been deleted.");
    runAfterOverlayTransition(() => fetchEvents());
  }

  async function openParticipants(event: EventItem) {
    setParticipantsDialog(event);
    setJoinMemberId("");
    const res = await fetch("/api/members?limit=200");
    const data = await res.json();
    setMemberSearch(data.members ?? []);
  }

  async function handleJoin(eventId: string, userId: string, action: "join" | "leave") {
    setJoiningEvent(true);
    const res = await fetch(`/api/events/${eventId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    setJoiningEvent(false);
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message);
      // Refresh events & dialog
      const updated = await fetch("/api/events").then((r) => r.json());
      const updatedList: EventItem[] = Array.isArray(updated) ? updated : [];
      setEvents(updatedList);
      if (participantsDialog) {
        const found = updatedList.find((e) => e._id === eventId);
        if (found) setParticipantsDialog(found);
      }
    } else {
      toast.error(data.error ?? "Error");
    }
  }

  return (
    <>
      <Header title="Event Management" />
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-[13px] text-slate-500">{events.length} events</p>
          <Button onClick={() => setShowDialog(true)} size="sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} /> Add Event
          </Button>
        </div>

        <div className="border border-slate-200 rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200">
                <TableHead className="text-xs text-slate-500 font-medium h-8">Event</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">Type</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">Date</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">Location</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">Participants</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">Fee</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">Status</TableHead>
                <TableHead className="text-xs text-slate-500 font-medium h-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-400 text-[13px]">
                    <CalendarDays className="w-5 h-5 mx-auto mb-1.5 text-slate-300" strokeWidth={1.5} />
                    No events found.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event._id} className="border-b border-slate-100">
                    <TableCell className="py-2">
                      <div>
                        <span className="text-[13px] font-medium text-slate-800">{event.title}</span>
                        {event.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{event.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="rounded-md text-[11px] font-medium border-slate-200 text-slate-600">
                        {TYPE_MAP[event.type] ?? event.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-slate-300" strokeWidth={1.5} />
                        <span className="text-[13px] text-slate-600">{formatDate(event.date)}</span>
                      </div>
                      {event.endDate && (
                        <span className="text-[11px] text-slate-400">to {formatDate(event.endDate)}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      {event.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-300" strokeWidth={1.5} />
                          <span className="text-[13px] text-slate-600">{event.location}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-300" strokeWidth={1.5} />
                        <span className="text-[13px] text-slate-600">
                          {event.participants?.length ?? 0}
                          {event.maxParticipants ? <span className="text-[11px] text-slate-400"> / {event.maxParticipants}</span> : null}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px] text-slate-600 py-2">
                      {event.fee && event.fee > 0 ? formatCurrency(event.fee) : "—"}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className={`rounded-md text-[11px] font-medium border ${STATUS_MAP[event.status]?.className ?? "border-slate-200 text-slate-500"}`}>
                        {STATUS_MAP[event.status]?.label ?? event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-1.5 text-[11px] text-blue-600 hover:bg-blue-50"
                          onClick={() => openParticipants(event)}
                          title="Manage participants"
                        >
                          <UserPlus className="w-3 h-3" strokeWidth={1.5} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-1.5 text-[11px]"
                          onClick={() => handleSendEventEmail(event._id)}
                          disabled={sendingEmail === event._id}
                          title="Send email notification"
                        >
                          {sendingEmail === event._id
                            ? <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
                            : <Mail className="w-3 h-3" strokeWidth={1.5} />
                          }
                        </Button>
                        <Select value={event.status} onValueChange={(v) => v !== null && updateStatus(event._id, v)}>
                          <SelectTrigger className="h-6 w-[90px] text-[11px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm" variant="outline"
                          className="h-6 px-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteEvent(event._id)}
                        >
                          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">Add Event</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Title *</Label>
              <Input className="h-8 text-[13px]" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Type</Label>
                <Select value={form.type} onValueChange={(v) => v !== null && setForm({ ...form, type: v })}>
                  <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Fee ($)</Label>
                <Input className="h-8 text-[13px]" type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Date *</Label>
                <Input className="h-8 text-[13px]" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">End Date</Label>
                <Input className="h-8 text-[13px]" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Location</Label>
                <Input className="h-8 text-[13px]" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Max Participants</Label>
                <Input className="h-8 text-[13px]" type="number" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Description</Label>
              <Textarea className="text-[13px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Participants Management Dialog */}
      <Dialog open={!!participantsDialog} onOpenChange={(o) => !o && setParticipantsDialog(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[13px] font-semibold">
              Participants — {participantsDialog?.title}
            </DialogTitle>
          </DialogHeader>
          {participantsDialog && (
            <div className="space-y-4 py-1">
              <div className="flex items-center justify-between text-[12px] text-slate-500">
                <span>{participantsDialog.participants?.length ?? 0} registered</span>
                {participantsDialog.maxParticipants && (
                  <span className="text-slate-400">Max: {participantsDialog.maxParticipants}</span>
                )}
              </div>

              {/* Add participant */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500">Add Member</Label>
                <div className="flex gap-2">
                  <Select value={joinMemberId} onValueChange={setJoinMemberId}>
                    <SelectTrigger className="h-8 text-[13px] flex-1"><SelectValue placeholder="Select member..." /></SelectTrigger>
                    <SelectContent>
                      {memberSearch
                        .filter((m) => !participantsDialog.participants?.some((p) => p._id === m._id))
                        .map((m) => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8 px-3" disabled={!joinMemberId || joiningEvent}
                    onClick={() => { if (joinMemberId) { handleJoin(participantsDialog._id, joinMemberId, "join"); setJoinMemberId(""); } }}>
                    <UserPlus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>

              {/* Participant list */}
              <div className="divide-y border rounded-lg overflow-hidden">
                {(participantsDialog.participants?.length ?? 0) === 0 ? (
                  <p className="text-center py-6 text-[13px] text-slate-400">No participants yet.</p>
                ) : (
                  participantsDialog.participants.map((p) => (
                    <div key={p._id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50">
                      <span className="text-[13px] text-slate-700">{p.name}</span>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-300 hover:text-red-500"
                        onClick={() => handleJoin(participantsDialog._id, p._id, "leave")}
                        disabled={joiningEvent}>
                        <UserMinus className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setParticipantsDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
