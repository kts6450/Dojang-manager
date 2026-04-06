"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, CalendarCheck, DollarSign, AlertTriangle,
  UserPlus, FileText, ScanLine, CreditCard,
  ChevronRight, Clock, TrendingUp, AlertCircle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MemberRow { _id: string; name: string; belt: string; joinedAt: string; status: string; }
interface ChartPoint { label: string; attendance: number; revenue: number; newMembers: number; }
interface EventRow { _id: string; title: string; date: string; type: string; }
interface TuitionRow { _id: string; memberName: string; amount: number; status: string; dueDate: string; }

interface BranchData {
  kpis: {
    members: number;
    activeMembers: number;
    todayAttendance: number;
    unpaidTuition: number;
    overdueTuition: number;
    monthRevenue: number;
    thisMonthMembers: number;
    memberGrowth: number;
  };
  chartData: ChartPoint[];
  recentMembers: MemberRow[];
  upcomingEvents: EventRow[];
  overdueTuitions: TuitionRow[];
}

const BELT_COLORS: Record<string, string> = {
  white: "bg-slate-200", yellow: "bg-yellow-400", orange: "bg-orange-400",
  green: "bg-green-500", blue: "bg-blue-500", purple: "bg-purple-500",
  red: "bg-red-500", brown: "bg-amber-700", black: "bg-slate-900",
};

const EVENT_TYPE: Record<string, string> = {
  competition: "text-red-600 bg-red-50",
  seminar: "text-purple-600 bg-purple-50",
  exam: "text-blue-600 bg-blue-50",
  social: "text-green-600 bg-green-50",
  other: "text-slate-600 bg-slate-50",
};

export function BranchDashboard({ branchName }: { branchName?: string }) {
  const [data, setData] = useState<BranchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Reuse existing dashboard data endpoint (session-scoped to branch)
        const [membersRes, attendanceRes, tuitionRes, eventsRes] = await Promise.all([
          fetch("/api/members?limit=5&sort=joinedAt"),
          fetch("/api/attendance/stats"),
          fetch("/api/tuition?status=overdue&limit=5"),
          fetch("/api/events?status=upcoming&limit=4"),
        ]);

        const [membersData, statsData, tuitionData, eventsData] = await Promise.all([
          membersRes.ok ? membersRes.json() : { members: [], total: 0 },
          attendanceRes.ok ? attendanceRes.json() : {},
          tuitionRes.ok ? tuitionRes.json() : { tuitions: [] },
          eventsRes.ok ? eventsRes.json() : { events: [] },
        ]);

        setData({
          kpis: {
            members: statsData.totalMembers ?? membersData.total ?? 0,
            activeMembers: statsData.activeMembers ?? 0,
            todayAttendance: statsData.todayAttendance ?? 0,
            unpaidTuition: statsData.unpaidTuition ?? 0,
            overdueTuition: statsData.overdueTuition ?? 0,
            monthRevenue: statsData.monthRevenue ?? 0,
            thisMonthMembers: statsData.thisMonthMembers ?? 0,
            memberGrowth: statsData.memberGrowth ?? 0,
          },
          chartData: statsData.chartData ?? [],
          recentMembers: membersData.members ?? [],
          upcomingEvents: eventsData.events ?? [],
          overdueTuitions: tuitionData.tuitions ?? [],
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { kpis, chartData, recentMembers, upcomingEvents, overdueTuitions } = data;

  const kpiCards = [
    {
      label: "Total Members",
      value: kpis.members,
      sub: `${kpis.activeMembers} active`,
      icon: Users,
      color: "text-indigo-600", bg: "bg-indigo-50",
      change: kpis.memberGrowth,
    },
    {
      label: "Today's Check-ins",
      value: kpis.todayAttendance,
      sub: "Live attendance",
      icon: CalendarCheck,
      color: "text-sky-600", bg: "bg-sky-50",
      change: null,
    },
    {
      label: "Monthly Revenue",
      value: `₩${kpis.monthRevenue.toLocaleString()}`,
      sub: "This month",
      icon: DollarSign,
      color: "text-emerald-600", bg: "bg-emerald-50",
      change: null,
    },
    {
      label: "Overdue Payments",
      value: kpis.overdueTuition,
      sub: `${kpis.unpaidTuition} total unpaid`,
      icon: AlertTriangle,
      color: "text-rose-600", bg: "bg-rose-50",
      change: null,
    },
  ];

  const quickActions = [
    { label: "Add Member", href: "/members?action=new", icon: UserPlus, color: "bg-indigo-600 hover:bg-indigo-700 text-white" },
    { label: "Record Payment", href: "/tuition?action=new", icon: CreditCard, color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    { label: "QR Check-in", href: "/attendance/qr-scan", icon: ScanLine, color: "bg-sky-600 hover:bg-sky-700 text-white" },
    { label: "New Contract", href: "/contracts?action=new", icon: FileText, color: "bg-slate-700 hover:bg-slate-800 text-white" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1400px] space-y-5 p-5">

        {/* Hero */}
        <div className="rounded-xl border bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 mb-2">
                Branch Operations
              </span>
              <h2 className="text-xl font-semibold text-slate-900">
                {branchName ?? "My Branch"} Dashboard
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {kpis.members} members · {kpis.thisMonthMembers} joined this month · {kpis.unpaidTuition} payment{kpis.unpaidTuition !== 1 ? "s" : ""} pending
              </p>
            </div>
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {quickActions.map(({ label, href, icon: Icon, color }) => (
                <Link
                  key={label}
                  href={href}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${color}`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map(({ label, value, sub, icon: Icon, color, bg, change }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} strokeWidth={1.5} />
                </div>
                {change !== null && (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                    {change >= 0 ? "+" : ""}{change}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-0.5">{label}</p>
              <p className="text-[11px] text-slate-500 mt-1 border-t border-slate-100 pt-2">{sub}</p>
            </div>
          ))}
        </div>

        {/* Overdue Alert */}
        {kpis.overdueTuition > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-rose-700">
                {kpis.overdueTuition} overdue payment{kpis.overdueTuition > 1 ? "s" : ""} — action required
              </p>
              <p className="text-[11px] text-rose-500 mt-0.5">Contact members and send reminders promptly.</p>
            </div>
            <Link href="/tuition" className="text-[11px] font-medium text-rose-600 hover:text-rose-700 shrink-0">
              Review →
            </Link>
          </div>
        )}

        {/* Chart + Overdue list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Attendance Trend */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />
              <h3 className="text-[13px] font-semibold text-slate-900">6-Month Attendance Trend</h3>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="attendance" stroke="#6366f1" strokeWidth={2} fill="url(#attGrad)" name="Attendance" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">No attendance data yet.</div>
            )}
          </div>

          {/* Overdue Tuitions */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-[13px] font-semibold text-slate-900">Overdue Payments</h3>
              <Link href="/tuition?status=overdue" className="text-[11px] text-indigo-600 hover:underline font-medium flex items-center gap-0.5">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y">
              {overdueTuitions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No overdue payments 🎉</div>
              ) : (
                overdueTuitions.map((t) => (
                  <div key={t._id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-rose-600">{t.memberName?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-slate-900 truncate">{t.memberName}</p>
                      <p className="text-[10px] text-rose-500">₩{t.amount?.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Members + Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Members */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-[13px] font-semibold text-slate-900">Recent Members</h3>
              <Link href="/members" className="text-[11px] text-indigo-600 hover:underline font-medium flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y">
              {recentMembers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No members yet.</div>
              ) : (
                recentMembers.map((m) => (
                  <div key={m._id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600 shrink-0">
                      {m.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-900 truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(m.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${BELT_COLORS[m.belt] ?? "bg-slate-300"}`} />
                      <span className="text-[11px] text-slate-500 capitalize">{m.belt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-[13px] font-semibold text-slate-900">Upcoming Events</h3>
              <Link href="/events" className="text-[11px] text-indigo-600 hover:underline font-medium flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y">
              {upcomingEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No upcoming events.</div>
              ) : (
                upcomingEvents.map((e) => {
                  const d = new Date(e.date);
                  return (
                    <div key={e._id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="w-9 h-9 rounded-md bg-slate-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] text-slate-500 font-medium uppercase">
                          {d.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-slate-900 truncate">{e.title}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {d.toLocaleDateString("en-US", { weekday: "long" })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${EVENT_TYPE[e.type] ?? EVENT_TYPE.other}`}>
                        {e.type}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
