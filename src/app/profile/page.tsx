"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, KeyRound, Phone, MapPin, AlertCircle, Save } from "lucide-react";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
  belt?: string;
  beltLevel?: number;
  joinedAt?: string;
}

const ROLE_LABELS: Record<string, string> = {
  HQ_ADMIN: "HQ Admin",
  BRANCH_ADMIN: "Branch Manager",
  MEMBER: "Member",
  STUDENT: "Student",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", emergencyContact: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          emergencyContact: data.emergencyContact ?? "",
        });
      });
  }, []);

  async function handleSaveProfile() {
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setProfile((prev) => ({ ...prev!, ...updated }));
      toast.success("Profile updated successfully.");
    } else {
      toast.error("Failed to update profile.");
    }
  }

  async function handleChangePassword() {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error("All password fields are required.");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setChangingPw(true);
    const res = await fetch("/api/users/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    });
    setChangingPw(false);
    if (res.ok) {
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully.");
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to change password.");
    }
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <Header title="My Profile" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header title="My Profile" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-2xl mx-auto space-y-5">

          {/* Account Info Banner */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{profile.name}</p>
              <p className="text-sm text-slate-500">{profile.email}</p>
              <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </span>
            </div>
          </div>

          {/* Profile Edit */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500">Full Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500">Email (read-only)</Label>
                  <Input value={profile.email} disabled className="h-9 text-sm bg-slate-50 text-slate-400" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" strokeWidth={1.5} />Phone</span>
                  </Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" strokeWidth={1.5} />Emergency Contact</span>
                  </Label>
                  <Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} placeholder="Name / Phone" className="h-9 text-sm" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={1.5} />Address</span>
                  </Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City, State" className="h-9 text-sm" />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="gap-1.5">
                  <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-500">Current Password</Label>
                  <Input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="h-9 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500">New Password</Label>
                    <Input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Min. 6 characters" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500">Confirm New Password</Label>
                    <Input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="h-9 text-sm" />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={handleChangePassword} disabled={changingPw} className="gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {changingPw ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}
