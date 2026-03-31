"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, CalendarCheck, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface ReportData {
  summary: { totalMembers: number; activeMembers: number; totalRevenue: number; totalAttendance: number };
  membersByRole: { _id: string; count: number }[];
  attendanceByMonth: { month: number; total: number; present: number; absent: number; late: number }[];
  tuitionByMonth: { month: number; total: number; count: number }[];
  beltDistribution: { _id: string; count: number }[];
}

const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const ROLE_LABELS: Record<string, string> = { admin: "관리자", instructor: "강사", member: "회원", student: "학생" };
const BELT_LABELS: Record<string, string> = {
  white: "흰띠", yellow: "노란띠", orange: "주황띠", green: "초록띠",
  blue: "파란띠", purple: "보라띠", red: "빨간띠", brown: "갈색띠", black: "검정띠",
};

const BELT_CHART_COLORS: Record<string, string> = {
  white: "#e2e8f0", yellow: "#facc15", orange: "#fb923c", green: "#22c55e",
  blue: "#3b82f6", purple: "#a855f7", red: "#ef4444", brown: "#92400e", black: "#0f172a",
};
const ROLE_CHART_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

async function downloadExcel(type: string, label: string) {
  toast.loading(`${label} 다운로드 중...`, { id: "excel" });
  try {
    const res = await fetch(`/api/reports/download?type=${type}`);
    if (!res.ok) throw new Error("실패");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${label} 다운로드 완료`, { id: "excel" });
  } catch {
    toast.error("다운로드 실패", { id: "excel" });
  }
}

function CustomTooltip({ active, payload, label, formatter }: {
  active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-3 text-sm">
      <p className="font-semibold text-slate-600 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-700">{formatter ? formatter(p.value) : p.value}</span>
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

  // 차트 데이터 변환
  const attendanceChartData = MONTH_NAMES.map((label, i) => {
    const found = data?.attendanceByMonth.find((a) => a.month === i + 1);
    return { label, 출석: found?.present ?? 0, 결석: found?.absent ?? 0, 지각: found?.late ?? 0 };
  });
  const tuitionChartData = MONTH_NAMES.map((label, i) => {
    const found = data?.tuitionByMonth.find((t) => t.month === i + 1);
    return { label, 수입: found?.total ?? 0, 건수: found?.count ?? 0 };
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
    { label: "전체 회원", value: data.summary.totalMembers, sub: `활성 ${data.summary.activeMembers}명`, icon: Users, color: "text-blue-600", bg: "bg-blue-50", gradient: "from-blue-500 to-blue-600" },
    { label: "연간 출석", value: `${data.summary.totalAttendance}회`, sub: `${year}년 누적`, icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-50", gradient: "from-emerald-500 to-emerald-600" },
    { label: "연간 수입", value: `₩${(data.summary.totalRevenue / 10000).toFixed(0)}만`, sub: "납부 총액", icon: CreditCard, color: "text-orange-600", bg: "bg-orange-50", gradient: "from-orange-500 to-orange-600" },
    { label: "월 평균 출석", value: `${Math.round(data.summary.totalAttendance / 12)}회`, sub: "월 평균", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50", gradient: "from-violet-500 to-violet-600" },
  ] : [];

  return (
    <DashboardLayout>
      <Header title="리포트" />
      <div className="flex-1 overflow-y-auto bg-slate-50/60">
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

          {/* 상단 컨트롤 */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-700">연간 통계 리포트</h2>
                <p className="text-xs text-slate-400">데이터 기반 도장 현황 분석</p>
              </div>
              <Select value={year} onValueChange={(v) => setYear(v ?? String(new Date().getFullYear()))}>
                <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => <SelectItem key={y} value={y}>{y}년</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { type: "members", label: "회원 목록" },
                { type: "attendance", label: "출결 기록" },
                { type: "tuition", label: "수강료 현황" },
                { type: "belt", label: "승급 기록" },
              ].map(({ type, label }) => (
                <Button key={type} variant="outline" size="sm"
                  className="h-9 gap-1.5 text-slate-600 hover:text-blue-600 hover:border-blue-300"
                  onClick={() => downloadExcel(type, label)}>
                  <Download className="w-3.5 h-3.5" />{label}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400">데이터 분석 중...</p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* 요약 카드 */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {summaryStats.map(({ label, value, sub, icon: Icon, gradient }) => (
                  <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
                    <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm mb-4`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-black text-slate-800 tabular-nums">{value}</p>
                    <p className="text-sm font-semibold text-slate-600 mt-1">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              {/* 출결 차트 */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <h3 className="text-sm font-bold text-slate-700">월별 출결 현황</h3>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{year}년</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={attendanceChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                    <Bar dataKey="출석" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="지각" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="결석" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 수강료 차트 */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <h3 className="text-sm font-bold text-slate-700">월별 수강료 수입</h3>
                  <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">{year}년</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={tuitionChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradReport" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => v >= 10000 ? `${Math.floor(v/10000)}만` : String(v)} />
                    <Tooltip content={<CustomTooltip formatter={(v) => `₩${v.toLocaleString()}`} />} />
                    <Area type="monotone" dataKey="수입" stroke="#10b981" strokeWidth={2.5}
                      fill="url(#revenueGradReport)" dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                      activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 파이 차트 2개 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 역할별 분포 */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-5">역할별 회원 분포</h3>
                  {rolePieData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-300 text-sm">데이터 없음</div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="50%" height={160}>
                        <PieChart>
                          <Pie data={rolePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={68}
                            dataKey="value" paddingAngle={2}>
                            {rolePieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => `${String(v)}명`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {rolePieData.map((d) => {
                          const total = rolePieData.reduce((s, x) => s + x.value, 0);
                          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                          return (
                            <div key={d.name}>
                              <div className="flex justify-between text-xs mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                  <span className="text-slate-600 font-medium">{d.name}</span>
                                </div>
                                <span className="font-bold text-slate-700">{d.value}명</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: d.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 벨트 분포 */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-5">벨트 분포</h3>
                  {beltPieData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-300 text-sm">데이터 없음</div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="50%" height={160}>
                        <PieChart>
                          <Pie data={beltPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={68}
                            dataKey="value" paddingAngle={2}>
                            {beltPieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} stroke={entry.color === "#e2e8f0" ? "#cbd5e1" : entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => `${String(v)}명`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {beltPieData.map((d) => {
                          const total = beltPieData.reduce((s, x) => s + x.value, 0);
                          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                          return (
                            <div key={d.name} className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full shrink-0 border border-slate-200" style={{ background: d.color }} />
                              <span className="text-xs text-slate-600 flex-1">{d.name}</span>
                              <span className="text-xs font-bold text-slate-700 tabular-nums">{d.value}명</span>
                              <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
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
    </DashboardLayout>
  );
}
