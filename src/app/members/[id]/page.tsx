"use client";

import { useState, useEffect, use } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MapPin, Shield, TrendingUp, DollarSign, Award, FileText, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface MemberSummary {
  member: {
    _id: string; name: string; email: string; phone?: string; belt?: string; beltLevel?: number;
    role: string; status: string; joinedAt?: string; address?: string; emergencyContact?: string;
  };
  attendanceSummary: {
    total: number; present: number; late: number; absent: number; attendanceRate: number;
  };
  monthlyAttendance: { month: string; count: number }[];
  recentAttendance: { _id: string; classType: string; date: string; status: string }[];
  tuitionSummary: { totalUnpaid: number; unpaidCount: number };
  recentTuition: { _id: string; amount: number; status: string; dueDate: string }[];
  beltHistory: { _id: string; belt: string; promotionDate: string; notes?: string }[];
  activeContract: { _id: string; title: string; endDate: string; amount: number } | null;
}

const BELT_COLORS: Record<string, string> = {
  white: "bg-gray-100 text-gray-700 border-gray-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  orange: "bg-orange-100 text-orange-800 border-orange-300",
  green: "bg-green-100 text-green-800 border-green-300",
  blue: "bg-blue-100 text-blue-800 border-blue-300",
  purple: "bg-purple-100 text-purple-800 border-purple-300",
  red: "bg-red-100 text-red-800 border-red-300",
  brown: "bg-amber-100 text-amber-800 border-amber-300",
  black: "bg-gray-900 text-white border-gray-700",
};

const STATUS_DOT: Record<string, string> = {
  present: "bg-emerald-500", absent: "bg-red-500", late: "bg-yellow-500", excused: "bg-blue-500",
};

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/members/${id}/summary`)
      .then((r) => r.json())
      .then((data) => { setSummary(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <Header title="Member Detail" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!summary || !summary.member) {
    return (
      <DashboardLayout>
        <Header title="Member Detail" />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-slate-500 text-sm">Member not found.</p>
          <Link href="/members"><Button size="sm" variant="outline"><ArrowLeft className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />Back</Button></Link>
        </div>
      </DashboardLayout>
    );
  }

  const { member, attendanceSummary, monthlyAttendance, recentAttendance, tuitionSummary, recentTuition, beltHistory, activeContract } = summary;
  const beltColor = BELT_COLORS[member.belt ?? "white"] ?? "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <DashboardLayout>
      <Header title="Member Detail" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto space-y-5">

          {/* Back + Header */}
          <div className="flex items-center gap-3">
            <Link href="/members">
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-slate-500">
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> Members
              </Button>
            </Link>
          </div>

          {/* Profile card */}
          <div className="flex items-center gap-4 p-5 border border-slate-200 rounded-xl bg-white">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-slate-800">{member.name}</h1>
                <Badge variant="outline" className={cn("text-[11px] font-medium border capitalize rounded-md", beltColor)}>
                  {member.belt ?? "White"} Belt
                  {member.beltLevel && <span className="ml-1 opacity-70">Lv.{member.beltLevel}</span>}
                </Badge>
                <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full",
                  member.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                )}>
                  {member.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{member.email}</p>
              <div className="flex flex-wrap gap-3 mt-1.5 text-[12px] text-slate-400">
                {member.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" strokeWidth={1.5} />{member.phone}</span>}
                {member.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={1.5} />{member.address}</span>}
                {member.joinedAt && <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3" strokeWidth={1.5} />Joined {formatDate(member.joinedAt)}</span>}
              </div>
            </div>
            {activeContract && (
              <div className="hidden sm:block border border-emerald-200 bg-emerald-50 rounded-lg px-4 py-3 text-right flex-shrink-0">
                <p className="text-[11px] text-emerald-600 font-medium">Active Contract</p>
                <p className="text-[13px] font-semibold text-emerald-800 mt-0.5">{activeContract.title}</p>
                <p className="text-[11px] text-emerald-600">Expires {formatDate(activeContract.endDate)}</p>
              </div>
            )}
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Attendance Rate", value: `${attendanceSummary.attendanceRate}%`, icon: TrendingUp, color: "text-emerald-600" },
              { label: "Total Classes", value: attendanceSummary.total, icon: CalendarCheck, color: "text-blue-600" },
              { label: "Unpaid Tuition", value: formatCurrency(tuitionSummary.totalUnpaid), icon: DollarSign, color: tuitionSummary.totalUnpaid > 0 ? "text-red-500" : "text-slate-500" },
              { label: "Belt Promotions", value: beltHistory.length, icon: Award, color: "text-amber-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="border border-slate-200 rounded-xl bg-white px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-500">{label}</span>
                  <Icon className={cn("w-4 h-4", color)} strokeWidth={1.5} />
                </div>
                <p className={cn("text-xl font-semibold tabular-nums", color)}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Attendance Chart */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                  Monthly Attendance (6 months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyAttendance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={monthlyAttendance} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-sm text-slate-400 py-8">No attendance data.</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                  Recent Classes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentAttendance.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-6">No recent records.</p>
                  ) : (
                    recentAttendance.map((a) => (
                      <div key={a._id} className="flex items-center justify-between px-4 py-2">
                        <div>
                          <p className="text-[13px] font-medium text-slate-700">{a.classType}</p>
                          <p className="text-[11px] text-slate-400">{formatDate(a.date)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[a.status] ?? "bg-slate-400")} />
                          <span className="text-[12px] text-slate-500 capitalize">{a.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tuition History */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                  Tuition History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentTuition.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-6">No tuition records.</p>
                  ) : (
                    recentTuition.map((t) => (
                      <div key={t._id} className="flex items-center justify-between px-4 py-2">
                        <div>
                          <p className="text-[13px] font-medium text-slate-700">{formatCurrency(t.amount)}</p>
                          <p className="text-[11px] text-slate-400">Due {formatDate(t.dueDate)}</p>
                        </div>
                        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full",
                          t.status === "paid" ? "bg-emerald-50 text-emerald-700" :
                          t.status === "overdue" ? "bg-red-50 text-red-600" :
                          "bg-yellow-50 text-yellow-700"
                        )}>
                          {t.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Belt History */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                  Belt Promotion History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {beltHistory.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-6">No promotions yet.</p>
                  ) : (
                    beltHistory.map((b) => (
                      <div key={b._id} className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md border capitalize", BELT_COLORS[b.belt] ?? "bg-gray-100 text-gray-700 border-gray-300")}>
                            {b.belt}
                          </span>
                          {b.notes && <p className="text-[11px] text-slate-400">{b.notes}</p>}
                        </div>
                        <span className="text-[12px] text-slate-400">{formatDate(b.promotionDate)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contract info */}
          {activeContract && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
                  Active Contract
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-emerald-800">{activeContract.title}</p>
                    <p className="text-[12px] text-emerald-600 mt-0.5">Expires: {formatDate(activeContract.endDate)} · {formatCurrency(activeContract.amount)}</p>
                  </div>
                  <Link href="/contracts">
                    <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">View Contract</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
