"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, CalendarCheck, DollarSign, AlertTriangle,
  TrendingUp, Trophy, UserPlus, FileWarning, BarChart3,
  ArrowUpRight, Building2, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface BranchStat {
  branchId: string;
  branchName: string;
  branchCode: string;
  members: number;
  todayAttendance: number;
  monthRevenue: number;
  overdueCount: number;
  newToday: number;
}

interface DashboardData {
  totals: {
    members: number;
    todayAttendance: number;
    monthRevenue: number;
    overdueCount: number;
    newToday: number;
  };
  branchStats: BranchStat[];
  rankings: { byRevenue: BranchStat[]; byAttendance: BranchStat[] };
  expiringContracts: { id: string; memberName: string; endDate: string }[];
  weeklyCheckins: { date: string; label: string; count: number }[];
}

const BRANCH_COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6"];

export function HQDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
      setRefreshedAt(new Date());
    }
  }

  useEffect(() => { load(); }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading corporate data...</span>
        </div>
      </div>
    );
  }

  const { totals, branchStats, rankings, expiringContracts, weeklyCheckins } = data;

  const kpis = [
    { label: "Total Members", value: totals.members.toLocaleString(), sub: `+${totals.newToday} today`, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
    { label: "Today's Check-ins", value: totals.todayAttendance.toLocaleString(), sub: "Across all branches", icon: CalendarCheck, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" },
    { label: "Monthly Revenue", value: `₩${totals.monthRevenue.toLocaleString()}`, sub: "This month", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Overdue Payments", value: totals.overdueCount.toLocaleString(), sub: "Needs follow-up", icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1400px] space-y-5 p-5">

        {/* Hero Banner */}
        <div className="rounded-xl bg-gradient-to-r from-slate-900 to-indigo-900 p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-200" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Corporate Overview</h2>
                <p className="text-indigo-300 text-sm">
                  {branchStats.length} branches · Updated {refreshedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={load}
                className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <Link
                href="/admin/reports"
                className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" /> Full Report <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Total KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
            <div key={label} className={`rounded-xl border ${border} bg-white p-4`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-0.5">{label}</p>
              <p className="text-[11px] text-slate-500 mt-1 border-t border-slate-100 pt-2">{sub}</p>
            </div>
          ))}
        </div>

        {/* Branch KPI Cards */}
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Branch Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {branchStats.map((b, i) => (
              <div key={b.branchId} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length] }} />
                  <span className="text-[13px] font-semibold text-slate-900">{b.branchName}</span>
                  <span className="ml-auto text-[10px] text-slate-400 font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">{b.branchCode}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-lg font-bold text-slate-900">{b.members}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> Members</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-lg font-bold text-slate-900">{b.todayAttendance}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-0.5"><CalendarCheck className="w-2.5 h-2.5" /> Today</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-lg font-bold text-slate-900">₩{(b.monthRevenue / 10000).toFixed(0)}만</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5" /> Revenue</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${b.overdueCount > 0 ? "bg-rose-50" : "bg-slate-50"}`}>
                    <p className={`text-lg font-bold ${b.overdueCount > 0 ? "text-rose-600" : "text-slate-900"}`}>{b.overdueCount}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Overdue</p>
                  </div>
                </div>
                {b.newToday > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <UserPlus className="w-3 h-3" /> {b.newToday} new registration{b.newToday > 1 ? "s" : ""} today
                  </div>
                )}
              </div>
            ))}
            {branchStats.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-400 text-sm">No active branches found.</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Weekly Check-in Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />
              <h3 className="text-[13px] font-semibold text-slate-900">Weekly Check-ins (All Branches)</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyCheckins} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  formatter={(v) => [v, "Check-ins"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {weeklyCheckins.map((_, i) => (
                    <Cell key={i} fill={i === weeklyCheckins.length - 1 ? "#6366f1" : "#e0e7ff"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Branch Rankings */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
              <h3 className="text-[13px] font-semibold text-slate-900">Branch Rankings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">By Monthly Revenue</p>
                <div className="space-y-1.5">
                  {rankings.byRevenue.slice(0, 3).map((b, i) => (
                    <div key={b.branchId} className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-600"}`}>
                        {i + 1}
                      </span>
                      <span className="text-[12px] text-slate-700 flex-1 truncate">{b.branchName}</span>
                      <span className="text-[12px] font-semibold text-slate-900">₩{b.monthRevenue.toLocaleString()}</span>
                    </div>
                  ))}
                  {rankings.byRevenue.length === 0 && <p className="text-[11px] text-slate-400">No data yet.</p>}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">By Today's Attendance</p>
                <div className="space-y-1.5">
                  {rankings.byAttendance.slice(0, 3).map((b, i) => (
                    <div key={b.branchId} className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-600"}`}>
                        {i + 1}
                      </span>
                      <span className="text-[12px] text-slate-700 flex-1 truncate">{b.branchName}</span>
                      <span className="text-[12px] font-semibold text-slate-900">{b.todayAttendance} check-ins</span>
                    </div>
                  ))}
                  {rankings.byAttendance.length === 0 && <p className="text-[11px] text-slate-400">No data yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expiring Contracts Alert */}
        {expiringContracts.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileWarning className="w-4 h-4 text-amber-600" strokeWidth={1.5} />
              <h3 className="text-[13px] font-semibold text-amber-800">Contracts Expiring Within 7 Days</h3>
              <Link href="/contracts" className="ml-auto text-[11px] text-amber-700 hover:underline font-medium">View all →</Link>
            </div>
            <div className="space-y-1.5">
              {expiringContracts.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-[12px]">
                  <span className="text-amber-800 font-medium">{c.memberName}</span>
                  <span className="text-amber-600">
                    Expires {new Date(c.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
