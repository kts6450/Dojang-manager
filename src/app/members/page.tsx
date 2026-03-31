"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, SlidersHorizontal, QrCode } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, runAfterOverlayTransition } from "@/lib/utils";
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
  { value: "white", label: "White", color: "bg-white border border-slate-300" },
  { value: "yellow", label: "Yellow", color: "bg-yellow-400" },
  { value: "orange", label: "Orange", color: "bg-orange-400" },
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "red", label: "Red", color: "bg-red-500" },
  { value: "brown", label: "Brown", color: "bg-amber-800" },
  { value: "black", label: "Black", color: "bg-slate-900" },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  instructor: "Instructor",
  member: "Member",
  student: "Student",
};

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  active: { label: "Active", dot: "bg-emerald-500" },
  inactive: { label: "Inactive", dot: "bg-slate-400" },
  pending: { label: "Pending", dot: "bg-yellow-500" },
};

const emptyForm = {
  name: "", email: "", password: "", phone: "", role: "member",
  belt: "white", beltLevel: 1, status: "active", birthDate: "", address: "", emergencyContact: "", notes: "",
};

function SkeletonRow() {
  return (
    <TableRow>
      {[...Array(7)].map((_, i) => (
        <TableCell key={i} className="py-2">
          <div className="h-3.5 bg-slate-100 rounded animate-pulse" style={{ width: i === 0 ? "120px" : i === 1 ? "140px" : "60px" }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

function MemberAvatar({ name, role }: { name: string; role: string }) {
  const initial = name.charAt(0).toUpperCase();
  const colorMap: Record<string, string> = {
    admin: "bg-violet-50 text-violet-600 border-violet-200",
    instructor: "bg-blue-50 text-blue-600 border-blue-200",
    member: "bg-slate-50 text-slate-500 border-slate-200",
    student: "bg-emerald-50 text-emerald-600 border-emerald-200",
  };
  const cls = colorMap[role] ?? "bg-slate-50 text-slate-500 border-slate-200";
  return (
    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 border", cls)}>
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
      toast.error("Name and email are required.");
      return;
    }
    if (!editTarget && !form.password) {
      toast.error("Please enter a password.");
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
      toast.success(editTarget ? "Member updated successfully." : "Member registered successfully.");
      setShowDialog(false);
      runAfterOverlayTransition(() => fetchMembers());
    } else {
      const err = await res.json();
      toast.error(err.error || "An error occurred.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/members/${deleteTarget}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Member deleted successfully.");
      setDeleteTarget(null);
      runAfterOverlayTransition(() => fetchMembers());
    }
  }

  function getBeltInfo(belt?: string) {
    return BELT_OPTIONS.find((b) => b.value === belt) ?? BELT_OPTIONS[0];
  }

  const activeCount = members.filter((member) => member.status === "active").length;
  const studentCount = members.filter((member) => member.role === "student").length;
  const instructorCount = members.filter((member) => member.role === "instructor").length;

  return (
    <DashboardLayout>
      <Header title="Members" />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <section className="rounded-xl border bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                Member operations
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Manage members with a cleaner operating view.</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Keep roster quality high, review belt progress, and access member records quickly.
                </p>
              </div>
            </div>
            <Button onClick={openCreate} className="h-9">
              <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
              Add Member
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Total roster</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{total}</p>
              <p className="mt-1 text-[12px] text-slate-500">All member records in workspace</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Active members</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{activeCount}</p>
              <p className="mt-1 text-[12px] text-slate-500">Currently participating members</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Role mix</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{studentCount + instructorCount}</p>
              <p className="mt-1 text-[12px] text-slate-500">{studentCount} students and {instructorCount} instructors</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900">Roster</h3>
              <p className="text-[11px] text-muted-foreground">Search and filter member records</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  placeholder="Name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-8 text-[13px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
                  <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Filters
                </div>
                <Select value={roleFilter || "all"} onValueChange={(v) => setRoleFilter(v === "all" ? "" : (v ?? ""))}>
                  <SelectTrigger className="h-9 w-[130px] text-[13px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <Card className="overflow-hidden rounded-xl border bg-white shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-slate-50/80">
                  <TableHead className="pl-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Member</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground py-2">Phone</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground py-2">Role</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground py-2">Belt</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground py-2">Status</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground py-2">Joined</TableHead>
                  <TableHead className="text-[11px] font-medium text-muted-foreground py-2 pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <p className="text-[13px] text-muted-foreground">No members found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m) => {
                    const beltInfo = getBeltInfo(m.belt);
                    const statusConf = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.inactive;
                    return (
                      <TableRow
                        key={m._id}
                        className="hover:bg-slate-50/50 border-b last:border-b-0 group"
                      >
                        <TableCell className="pl-4 py-2">
                          <div className="flex items-center gap-2.5">
                            <MemberAvatar name={m.name} role={m.role} />
                            <div>
                              <p className="text-[13px] font-medium text-slate-800">{m.name}</p>
                              <p className="text-[11px] text-muted-foreground">{m.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-muted-foreground py-2">{m.phone || "—"}</TableCell>
                        <TableCell className="text-[13px] text-muted-foreground py-2">
                          {ROLE_LABEL[m.role] ?? m.role}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full shrink-0", beltInfo.color)} />
                            <span className="text-[13px] text-slate-600">{beltInfo.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusConf.dot)} />
                            <span className="text-[13px] text-muted-foreground">{statusConf.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-muted-foreground py-2">
                          {formatDate(m.joinedAt)}
                        </TableCell>
                        <TableCell className="pr-4 text-right py-2">
                          <div className="flex justify-end gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-violet-600"
                              title="QR Code"
                              onClick={() => setQrTarget({ id: m._id, name: m.name })}
                            >
                              <QrCode className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-600"
                              onClick={() => openEdit(m)}
                            >
                              <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                              onClick={() => setDeleteTarget(m._id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[13px] font-semibold">
              {editTarget ? "Edit Member" : "Add New Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="col-span-2 space-y-1">
              <Label className="text-[11px] text-muted-foreground">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="h-8 text-[13px]" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-[11px] text-muted-foreground">Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" className="h-8 text-[13px]" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                {editTarget ? "Password (only if changing)" : "Password *"}
              </Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="h-8 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="123-456-7890" className="h-8 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Date of Birth</Label>
              <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="h-8 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Role</Label>
              <Select value={form.role} onValueChange={(v) => v !== null && setForm({ ...form, role: v })}>
                <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => v !== null && setForm({ ...form, status: v })}>
                <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Belt</Label>
              <Select value={form.belt} onValueChange={(v) => v !== null && setForm({ ...form, belt: v })}>
                <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BELT_OPTIONS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Belt Level (Dan)</Label>
              <Input
                type="number" min={1} max={10}
                value={form.beltLevel}
                onChange={(e) => setForm({ ...form, beltLevel: parseInt(e.target.value) || 1 })}
                className="h-8 text-[13px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)} className="text-[13px]">Cancel</Button>
            <Button size="sm" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-[13px]">
              {editTarget ? "Save Changes" : "Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {qrTarget && (
        <MemberQRCode
          memberId={qrTarget.id}
          memberName={qrTarget.name}
          open={!!qrTarget}
          onClose={() => setQrTarget(null)}
        />
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[13px] font-semibold">Delete Member</DialogTitle>
          </DialogHeader>
          <div className="flex items-start gap-3 py-1">
            <div className="w-8 h-8 border border-red-200 rounded-md flex items-center justify-center shrink-0">
              <Trash2 className="w-3.5 h-3.5 text-red-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[13px] text-slate-700">Are you sure you want to delete?</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Deleted data cannot be recovered.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="text-[13px]">Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="text-[13px]">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
