"use client";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface ChartDataItem {
  label: string;
  attendance: number;
  revenue: number;
  newMembers: number;
}

interface DashboardChartsProps {
  data: ChartDataItem[];
}

function CustomTooltip({ active, payload, label, formatter }: {
  active?: boolean;
  payload?: { color: string; name: string; value: number }[];
  label?: string;
  formatter?: (val: number) => string;
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

export function DashboardCharts({ data }: DashboardChartsProps) {
  const hasData = data.some((d) => d.attendance > 0 || d.revenue > 0 || d.newMembers > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* 월별 출석 현황 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700">월별 출석</h3>
            <p className="text-xs text-slate-400 mt-0.5">최근 6개월</p>
          </div>
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <span className="text-base">📅</span>
          </div>
        </div>
        {!hasData ? (
          <div className="h-40 flex items-center justify-center text-slate-300 text-sm">데이터 없음</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="attendance" name="출석"
                stroke="#3b82f6" strokeWidth={2.5}
                fill="url(#attendanceGrad)" dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#3b82f6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 월별 수강료 수입 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700">월별 수입</h3>
            <p className="text-xs text-slate-400 mt-0.5">최근 6개월</p>
          </div>
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
            <span className="text-base">💰</span>
          </div>
        </div>
        {!hasData ? (
          <div className="h-40 flex items-center justify-center text-slate-300 text-sm">데이터 없음</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 10000 ? `${Math.floor(v/10000)}만` : String(v)} />
              <Tooltip content={<CustomTooltip formatter={(v) => `₩${v.toLocaleString()}`} />} />
              <Area
                type="monotone" dataKey="revenue" name="수입"
                stroke="#10b981" strokeWidth={2.5}
                fill="url(#revenueGrad)" dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#10b981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 월별 신규 회원 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700">신규 회원</h3>
            <p className="text-xs text-slate-400 mt-0.5">최근 6개월</p>
          </div>
          <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
            <span className="text-base">👥</span>
          </div>
        </div>
        {!hasData ? (
          <div className="h-40 flex items-center justify-center text-slate-300 text-sm">데이터 없음</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="newMembers" name="신규" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
