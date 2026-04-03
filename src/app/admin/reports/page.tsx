"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Building2, Users, TrendingUp, DollarSign, Activity } from "lucide-react";
import { useBranch } from "@/contexts/BranchContext";

interface BranchStat {
  branchId: string;
  branchName: string;
  memberCount: number;
  attendanceCount: number;
  revenue: number;
  overdueCount: number;
}

interface CrossBranchData {
  stats: BranchStat[];
  totals: {
    members: number;
    attendance: number;
    revenue: number;
    overdue: number;
  };
  monthly: { month: string; revenue: number; attendance: number }[];
}

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function HQReportsPage() {
  const [data, setData] = useState<CrossBranchData | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedBranchId } = useBranch();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedBranchId) params.set("branchId", selectedBranchId);
    fetch(`/api/admin/reports?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBranchId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totals = data?.totals ?? { members: 0, attendance: 0, revenue: 0, overdue: 0 };
  const stats = data?.stats ?? [];
  const monthly = data?.monthly ?? [];

  const statCards = [
    { label: "Total Members", value: totals.members.toLocaleString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Monthly Check-ins", value: totals.attendance.toLocaleString(), icon: Activity, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Total Revenue", value: `₩${totals.revenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Overdue Count", value: totals.overdue.toLocaleString(), icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title Banner */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 opacity-80" />
          <div>
            <h2 className="text-lg font-bold">Corporate Overview</h2>
            <p className="text-indigo-200 text-sm mt-0.5">Cross-branch analytics at a glance</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `₩${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={(v) => [`₩${Number(v).toLocaleString()}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Member Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Members by Branch</h3>
          {stats.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats} dataKey="memberCount" nameKey="branchName" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                  {stats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [Number(v), "Members"]} />
                <Legend formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No branch data available.</div>
          )}
        </div>
      </div>

      {/* Branch Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Branch Comparison</h3>
        </div>
        {stats.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No branch data registered.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Members</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Attendance</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.map((s, i) => (
                  <tr key={s.branchId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      {s.branchName}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700">{s.memberCount.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right text-slate-700">{s.attendanceCount.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right text-slate-700">₩{s.revenue.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={s.overdueCount > 0 ? "text-rose-600 font-medium" : "text-slate-500"}>
                        {s.overdueCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Attendance by Branch */}
      {stats.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Attendance by Branch</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="branchName" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip />
              <Bar dataKey="attendanceCount" name="Attendance" radius={[4, 4, 0, 0]}>
                {stats.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
