"use client";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
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
    <div className="bg-white rounded-lg border border-border p-2.5 text-xs shadow-sm">
      <p className="font-medium text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-semibold text-foreground ml-auto">{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

function getChange(data: ChartDataItem[], key: keyof ChartDataItem): number | null {
  if (data.length < 2) return null;
  const curr = data[data.length - 1][key] as number;
  const prev = data[data.length - 2][key] as number;
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function ChangeIndicator({ value }: { value: number | null }) {
  if (value === null) return null;
  const isUp = value >= 0;
  return (
    <span className={`text-[11px] font-medium ${isUp ? "text-emerald-600" : "text-red-500"}`}>
      {isUp ? "+" : ""}{value}% vs last month
    </span>
  );
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  const hasData = data.some((d) => d.attendance > 0 || d.revenue > 0 || d.newMembers > 0);
  const attendanceChange = getChange(data, "attendance");
  const revenueChange = getChange(data, "revenue");
  const membersChange = getChange(data, "newMembers");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[13px] font-medium text-foreground">Attendance</h3>
          <ChangeIndicator value={attendanceChange} />
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">Last 6 months</p>
        {!hasData ? (
          <div className="h-[140px] flex items-center justify-center text-muted-foreground text-xs">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="attendance" name="Attendance"
                stroke="#3b82f6" strokeWidth={1.5} fill="url(#attendanceGrad)"
                dot={false} activeDot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[13px] font-medium text-foreground">Revenue</h3>
          <ChangeIndicator value={revenueChange} />
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">Last 6 months</p>
        {!hasData ? (
          <div className="h-[140px] flex items-center justify-center text-muted-foreground text-xs">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
              <Tooltip content={<CustomTooltip formatter={(v) => `$${v.toLocaleString()}`} />} />
              <Area type="monotone" dataKey="revenue" name="Revenue"
                stroke="#10b981" strokeWidth={1.5} fill="url(#revenueGrad)"
                dot={false} activeDot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[13px] font-medium text-foreground">New Members</h3>
          <ChangeIndicator value={membersChange} />
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">Last 6 months</p>
        {!hasData ? (
          <div className="h-[140px] flex items-center justify-center text-muted-foreground text-xs">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="newMembers" name="New" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
