"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/shared/Header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, CalendarCheck, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

interface ReportData {
  summary: { totalMembers: number; activeMembers: number; totalRevenue: number; totalAttendance: number };
  membersByRole: { _id: string; count: number }[];
  attendanceByMonth: { month: number; total: number; present: number; absent: number; late: number }[];
  tuitionByMonth: { month: number; total: number; count: number }[];
  beltDistribution: { _id: string; count: number }[];
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ROLE_LABELS: Record<string, string> = { admin: "Admin", instructor: "Instructor", member: "Member", student: "Student" };
const BELT_LABELS: Record<string, string> = {
  white: "White", yellow: "Yellow", orange: "Orange", green: "Green",
  blue: "Blue", purple: "Purple", red: "Red", brown: "Brown", black: "Black",
};

const BELT_CHART_COLORS: Record<string, string> = {
  white: "#e2e8f0", yellow: "#facc15", orange: "#fb923c", green: "#22c55e",
  blue: "#3b82f6", purple: "#a855f7", red: "#ef4444", brown: "#92400e", black: "#0f172a",
};
const ROLE_CHART_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

async function downloadExcel(type: string, label: string) {
  toast.loading(`Downloading ${label}...`, { id: "excel" });
  try {
    const res = await fetch(`/api/reports/download?type=${type}`);
    if (!res.ok) throw new Error("Failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${label} download complete`, { id: "excel" });
  } catch {
    toast.error("Download failed", { id: "excel" });
  }
}

function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-slate-200 bg-white rounded-md p-2.5 text-[13px]">
      <p className="font-medium text-slate-600 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 text-[11px]">{p.name}:</span>
          <span className="font-medium text-slate-700 text-[11px]">{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports?year=${year}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [year]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  const attendanceChartData = MONTH_NAMES.map((label, i) => {
    const found = data?.attendanceByMonth.find((a) => a.month === i + 1);
    return { label, Present: found?.present ?? 0, Absent: found?.absent ?? 0, Late: found?.late ?? 0 };
  });
  const tuitionChartData = MONTH_NAMES.map((label, i) => {
    const found = data?.tuitionByMonth.find((t) => t.month === i + 1);
    return { label, Revenue: found?.total ?? 0, Count: found?.count ?? 0 };
  });
  const beltPieData = (data?.beltDistribution ?? []).map((b) => ({
    name: BELT_LABELS[b._id] ?? b._id,
    value: b.count,
    color: BELT_CHART_COLORS[b._id] ?? "#94a3b8",
  }));
  const rolePieData = (data?.membersByRole ?? []).map((r, i) => ({
    name: ROLE_LABELS[r._id] ?? r._id,
    value: r.count,
    color: ROLE_CHART_COLORS[i % ROLE_CHART_COLORS.length],
  }));

  const summaryStats = data ? [
    { label: "Total Members", value: String(data.summary.totalMembers), sub: `${data.summary.activeMembers} active`, icon: Users },
    { label: "Annual Attendance", value: String(data.summary.totalAttendance), sub: `${year} cumulative`, icon: CalendarCheck },
    { label: "Annual Revenue", value: formatCurrency(Math.round(data.summary.totalRevenue)), sub: "Total paid", icon: CreditCard },
    { label: "Avg Monthly Attendance", value: String(Math.round(data.summary.totalAttendance / 12)), sub: "Per month", icon: TrendingUp },
  ] : [];

  return (
    <>
      <Header title="Reports" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4 max-w-[1400px] mx-auto">

          <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 rounded-md px-4 py-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              <div>
                <h2 className="text-[13px] font-medium text-slate-700">Annual Statistics</h2>
                <p className="text-[11px] text-slate-400">Data-driven dojang analysis</p>
              </div>
              <Select value={year} onValueChange={(v) => setYear(v ?? String(new Date().getFullYear()))}>
                <SelectTrigger className="w-24 h-8 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { type: "members", label: "Member List" },
                { type: "attendance", label: "Attendance" },
                { type: "tuition", label: "Tuition" },
                { type: "belt", label: "Belt Records" },
              ].map(({ type, label }) => (
                <Button key={type} variant="outline" size="sm"
                  className="h-7 gap-1.5 text-[11px] text-slate-600"
                  onClick={() => downloadExcel(type, label)}>
                  <Download className="w-3 h-3" strokeWidth={1.5} />{label}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                <p className="text-[13px] text-slate-400">Analyzing data...</p>
              </div>
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {summaryStats.map(({ label, value, sub, icon: Icon }) => (
                  <div key={label} className="border border-slate-200 rounded-md px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-500 font-medium">{label}</span>
                      <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-xl font-semibold text-slate-800 tabular-nums">{value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              <div className="border border-slate-200 rounded-md p-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-[13px] font-medium text-slate-700">Monthly Attendance</h3>
                  <span className="text-[11px] border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">{year}</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={attendanceChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="Present" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={24} />
                    <Bar dataKey="Late" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={24} />
                    <Bar dataKey="Absent" fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-3 justify-center">
                  {[
                    { label: "Present", color: "#3b82f6" },
                    { label: "Late", color: "#f59e0b" },
                    { label: "Absent", color: "#f87171" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-[11px] text-slate-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 rounded-md p-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-[13px] font-medium text-slate-700">Monthly Tuition Revenue</h3>
                  <span className="text-[11px] border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">{year}</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={tuitionChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradReport" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `$${Math.floor(v/1000)}k` : `$${v}`} />
                    <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} />
                    <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={1.5}
                      fill="url(#revenueGradReport)" dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                      activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-md p-4">
                  <h3 className="text-[13px] font-medium text-slate-700 mb-4">Members by Role</h3>
                  {rolePieData.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-slate-300 text-[13px]">No data</div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="45%" height={140}>
                        <PieChart>
                          <Pie data={rolePieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60}
                            dataKey="value" paddingAngle={2} strokeWidth={0}>
                            {rolePieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => `${String(v)}`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {rolePieData.map((d) => {
                          const total = rolePieData.reduce((s, x) => s + x.value, 0);
                          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                          return (
                            <div key={d.name}>
                              <div className="flex justify-between text-[11px] mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                  <span className="text-slate-600">{d.name}</span>
                                </div>
                                <span className="font-medium text-slate-700 tabular-nums">{d.value} ({pct}%)</span>
                              </div>
                              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: d.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-md p-4">
                  <h3 className="text-[13px] font-medium text-slate-700 mb-4">Belt Distribution</h3>
                  {beltPieData.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-slate-300 text-[13px]">No data</div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="45%" height={140}>
                        <PieChart>
                          <Pie data={beltPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60}
                            dataKey="value" paddingAngle={2} strokeWidth={0}>
                            {beltPieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} stroke={entry.color === "#e2e8f0" ? "#cbd5e1" : "none"} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => `${String(v)}`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-1.5">
                        {beltPieData.map((d) => {
                          const total = beltPieData.reduce((s, x) => s + x.value, 0);
                          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                          return (
                            <div key={d.name} className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-200" style={{ background: d.color }} />
                              <span className="text-[11px] text-slate-600 flex-1">{d.name}</span>
                              <span className="text-[11px] font-medium text-slate-700 tabular-nums">{d.value}</span>
                              <span className="text-[11px] text-slate-400 w-7 text-right tabular-nums">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
