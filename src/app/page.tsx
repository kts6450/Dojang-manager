import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Attendance from "@/lib/db/models/Attendance";
import Tuition from "@/lib/db/models/Tuition";
import Event from "@/lib/db/models/Event";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users, CalendarCheck, CreditCard, CalendarDays,
  AlertCircle, ArrowRight, ChevronRight,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { DashboardCharts } from "@/components/shared/DashboardCharts";
import { formatDate } from "@/lib/utils";

async function getDashboardData() {
  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

  const [
    totalMembers, activeMembers, lastMonthMembers, thisMonthMembers,
    todayAttendance, unpaidTuition, overdueTuition,
    upcomingEvents, recentMembers,
    monthlyAttendanceRaw, monthlyTuitionRaw, monthlyMembersRaw,
  ] = await Promise.all([
    User.countDocuments({ role: { $in: ["member", "student"] } }),
    User.countDocuments({ role: { $in: ["member", "student"] }, status: "active" }),
    User.countDocuments({ role: { $in: ["member", "student"] }, joinedAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
    User.countDocuments({ role: { $in: ["member", "student"] }, joinedAt: { $gte: thisMonthStart } }),
    Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
    Tuition.countDocuments({ status: { $in: ["pending", "overdue"] } }),
    Tuition.countDocuments({ status: "overdue" }),
    Event.find({ date: { $gte: today }, status: "upcoming" }).sort({ date: 1 }).limit(5).lean(),
    User.find({ role: { $in: ["member", "student"] } }).sort({ joinedAt: -1 }).limit(5)
      .select("name belt joinedAt role status").lean(),
    Attendance.aggregate([
      { $match: { date: { $gte: sixMonthsAgo }, status: "present" } },
      { $group: { _id: { year: { $year: "$date" }, month: { $month: "$date" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Tuition.aggregate([
      { $match: { status: "paid", paidAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } }, total: { $sum: "$amount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    User.aggregate([
      { $match: { role: { $in: ["member", "student"] }, joinedAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$joinedAt" }, month: { $month: "$joinedAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_LABELS[d.getMonth()] };
  });

  const toMap = (arr: { _id: { year: number; month: number }; count?: number; total?: number }[]) =>
    new Map(arr.map((x) => [`${x._id.year}-${x._id.month}`, x.count ?? x.total ?? 0]));

  const attendanceMap = toMap(monthlyAttendanceRaw);
  const tuitionMap = toMap(monthlyTuitionRaw);
  const membersMap = toMap(monthlyMembersRaw);

  const chartData = months.map(({ year, month, label }) => ({
    label,
    attendance: attendanceMap.get(`${year}-${month}`) ?? 0,
    revenue: tuitionMap.get(`${year}-${month}`) ?? 0,
    newMembers: membersMap.get(`${year}-${month}`) ?? 0,
  }));

  const memberGrowth = lastMonthMembers > 0
    ? Math.round(((thisMonthMembers - lastMonthMembers) / lastMonthMembers) * 100)
    : thisMonthMembers > 0 ? 100 : 0;

  return {
    totalMembers, activeMembers, thisMonthMembers, memberGrowth,
    todayAttendance, unpaidTuition, overdueTuition,
    upcomingEvents, recentMembers, chartData,
  };
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  competition: { label: "Competition", color: "text-red-600 bg-red-50" },
  seminar: { label: "Seminar", color: "text-purple-600 bg-purple-50" },
  exam: { label: "Exam", color: "text-blue-600 bg-blue-50" },
  social: { label: "Social", color: "text-green-600 bg-green-50" },
  other: { label: "Other", color: "text-slate-600 bg-slate-50" },
};

const BELT_COLORS: Record<string, string> = {
  white: "bg-slate-200", yellow: "bg-yellow-400", orange: "bg-orange-400",
  green: "bg-green-500", blue: "bg-blue-500", purple: "bg-purple-500",
  red: "bg-red-500", brown: "bg-amber-800", black: "bg-slate-900",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500", inactive: "bg-slate-300", pending: "bg-yellow-500",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const data = await getDashboardData();

  const kpis = [
    {
      label: "Total Members",
      value: data.totalMembers,
      sub: `${data.activeMembers} active`,
      change: data.memberGrowth,
      icon: Users,
    },
    {
      label: "Today's Attendance",
      value: data.todayAttendance,
      sub: "Check-ins today",
      change: null,
      icon: CalendarCheck,
    },
    {
      label: "Unpaid Tuition",
      value: data.unpaidTuition,
      sub: `${data.overdueTuition} overdue`,
      change: null,
      icon: CreditCard,
    },
    {
      label: "Upcoming Events",
      value: data.upcomingEvents.length,
      sub: "Scheduled",
      change: null,
      icon: CalendarDays,
    },
  ];

  return (
    <DashboardLayout>
      <Header title="Dashboard" />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] space-y-5 p-5">
          <section className="rounded-xl border bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                  Studio overview
                </span>
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    Run the studio from one operating system.
                  </h2>
                  <p className="max-w-2xl text-sm text-slate-500">
                    Monitor member growth, attendance, tuition risk, and upcoming events from a single dashboard.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-5 text-[12px] text-slate-500">
                  <div>
                    <span className="font-semibold text-slate-900">{data.totalMembers}</span> active member records
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">{data.unpaidTuition}</span> tuition items need follow-up
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">{data.upcomingEvents.length}</span> scheduled events ahead
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href="/members">Open members</Link>
                </Button>
                <Button asChild>
                  <Link href="/tuition">Review tuition</Link>
                </Button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map(({ label, value, sub, change, icon: Icon }) => (
              <div key={label} className="rounded-xl border bg-white p-4">
                <div className="mb-6 flex items-start justify-between">
                  <div className="space-y-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</span>
                    <p className="text-3xl font-semibold tracking-tight text-slate-950 tabular-nums">{value}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {change !== null && (
                      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-medium ${change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                        {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {change >= 0 ? "+" : ""}
                        {change}%
                      </span>
                    )}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <Icon className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 text-[12px] text-slate-500">{sub}</div>
              </div>
            ))}
          </div>

          <DashboardCharts data={data.chartData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-white">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-[13px] font-medium text-foreground">Upcoming Events</h3>
                <Link href="/events" className="text-[11px] text-primary hover:underline flex items-center gap-0.5 font-medium">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y">
                {data.upcomingEvents.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-xs text-muted-foreground">No upcoming events.</p>
                  </div>
                ) : (
                  data.upcomingEvents.map((event) => {
                    const typeConf = EVENT_TYPE_CONFIG[event.type] ?? EVENT_TYPE_CONFIG.other;
                    const d = new Date(event.date);
                    return (
                      <div key={String(event._id)} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-9 h-9 rounded-md bg-muted flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] text-muted-foreground font-medium uppercase leading-none">
                            {d.toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-sm font-bold text-foreground leading-tight">{d.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{event.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {d.toLocaleDateString("en-US", { weekday: "long" })}
                          </p>
                        </div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeConf.color}`}>
                          {typeConf.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-white">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-[13px] font-medium text-foreground">Recent Members</h3>
                <Link href="/members" className="text-[11px] text-primary hover:underline flex items-center gap-0.5 font-medium">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y">
                {data.recentMembers.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-xs text-muted-foreground">No members yet.</p>
                  </div>
                ) : (
                  data.recentMembers.map((member) => {
                    const belt = member.belt as string ?? "white";
                    const initial = (member.name as string).charAt(0);
                    return (
                      <div key={String(member._id)} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] font-medium text-foreground truncate">{member.name as string}</p>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[member.status as string] ?? "bg-slate-300"}`} />
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDate(member.joinedAt as Date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`w-2 h-2 rounded-full ${BELT_COLORS[belt]}`} />
                          <span className="text-[11px] text-muted-foreground capitalize">{belt}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {data.overdueTuition > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-red-700">
                  {data.overdueTuition} overdue tuition payment{data.overdueTuition > 1 ? "s" : ""}
                </p>
                <p className="text-[11px] text-red-500">Immediate action recommended.</p>
              </div>
              <Link
                href="/tuition"
                className="flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700 shrink-0"
              >
                Review <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
