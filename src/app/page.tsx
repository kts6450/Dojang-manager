import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Attendance from "@/lib/db/models/Attendance";
import Tuition from "@/lib/db/models/Tuition";
import Event from "@/lib/db/models/Event";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Header } from "@/components/shared/Header";
import Link from "next/link";
import {
  Users, CalendarCheck, CreditCard, TrendingUp,
  AlertCircle, ArrowRight, Award, UserPlus, ChevronRight,
  ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import { DashboardCharts } from "@/components/shared/DashboardCharts";

async function getDashboardData() {
  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  // 최근 6개월 월별 데이터 집계
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
    Event.find({ date: { $gte: today }, status: "upcoming" }).sort({ date: 1 }).limit(4).lean(),
    User.find({ role: { $in: ["member", "student"] } }).sort({ joinedAt: -1 }).limit(5)
      .select("name belt joinedAt role status").lean(),
    // 월별 출결
    Attendance.aggregate([
      { $match: { date: { $gte: sixMonthsAgo }, status: "present" } },
      { $group: { _id: { year: { $year: "$date" }, month: { $month: "$date" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    // 월별 수강료 수입
    Tuition.aggregate([
      { $match: { status: "paid", paidAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } }, total: { $sum: "$amount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    // 월별 신규 회원
    User.aggregate([
      { $match: { role: { $in: ["member", "student"] }, joinedAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$joinedAt" }, month: { $month: "$joinedAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  // 6개월 라벨 생성
  const MONTH_LABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
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
    totalMembers, activeMembers, lastMonthMembers, thisMonthMembers, memberGrowth,
    todayAttendance, unpaidTuition, overdueTuition,
    upcomingEvents, recentMembers, chartData,
  };
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  competition: { label: "대회", color: "bg-red-100 text-red-700" },
  seminar: { label: "세미나", color: "bg-purple-100 text-purple-700" },
  exam: { label: "심사", color: "bg-blue-100 text-blue-700" },
  social: { label: "행사", color: "bg-green-100 text-green-700" },
  other: { label: "기타", color: "bg-slate-100 text-slate-600" },
};

const BELT_COLORS: Record<string, string> = {
  white: "bg-white border border-slate-200", yellow: "bg-yellow-400", orange: "bg-orange-400",
  green: "bg-green-500", blue: "bg-blue-500", purple: "bg-purple-500",
  red: "bg-red-500", brown: "bg-amber-800", black: "bg-slate-900",
};
const BELT_LABELS: Record<string, string> = {
  white: "흰띠", yellow: "노란띠", orange: "주황띠", green: "초록띠",
  blue: "파란띠", purple: "보라띠", red: "빨간띠", brown: "갈색띠", black: "검정띠",
};
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500", inactive: "bg-slate-400", pending: "bg-yellow-500",
};

function GrowthBadge({ value }: { value: number }) {
  if (value > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
      <ArrowUpRight className="w-3 h-3" />+{value}%
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
      <ArrowDownRight className="w-3 h-3" />{value}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" />0%
    </span>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const data = await getDashboardData();

  const stats = [
    {
      title: "전체 회원",
      value: data.totalMembers,
      sub: `활성 ${data.activeMembers}명`,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      growth: data.memberGrowth,
      growthLabel: "전월 대비",
    },
    {
      title: "오늘 출석",
      value: data.todayAttendance,
      sub: "오늘 체크인",
      icon: CalendarCheck,
      gradient: "from-emerald-500 to-emerald-600",
      growth: null,
      growthLabel: null,
    },
    {
      title: "미납 수강료",
      value: data.unpaidTuition,
      sub: `연체 ${data.overdueTuition}건`,
      icon: CreditCard,
      gradient: data.overdueTuition > 0 ? "from-red-500 to-red-600" : "from-orange-500 to-orange-600",
      growth: null,
      growthLabel: null,
    },
    {
      title: "예정 이벤트",
      value: data.upcomingEvents.length,
      sub: "다가오는 일정",
      icon: TrendingUp,
      gradient: "from-violet-500 to-violet-600",
      growth: null,
      growthLabel: null,
    },
  ];

  const quickActions = [
    { href: "/members", icon: UserPlus, label: "회원 등록", color: "bg-blue-500 hover:bg-blue-600", shadow: "shadow-blue-200" },
    { href: "/attendance", icon: CalendarCheck, label: "출결 체크", color: "bg-emerald-500 hover:bg-emerald-600", shadow: "shadow-emerald-200" },
    { href: "/tuition", icon: CreditCard, label: "수강료 등록", color: "bg-orange-500 hover:bg-orange-600", shadow: "shadow-orange-200" },
    { href: "/belt-rank", icon: Award, label: "승급 심사", color: "bg-violet-500 hover:bg-violet-600", shadow: "shadow-violet-200" },
  ];

  return (
    <DashboardLayout>
      <Header title="대시보드" />
      <div className="flex-1 overflow-y-auto bg-slate-50/60">
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

          {/* 환영 배너 */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl shadow-blue-200">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1">안녕하세요, {session.user?.name}님 👋</p>
                <h2 className="text-2xl font-bold">오늘도 좋은 하루 되세요!</h2>
                <p className="text-blue-200 text-sm mt-2">
                  활성 회원 <span className="text-white font-bold">{data.activeMembers}명</span>
                  {data.thisMonthMembers > 0 && (
                    <span className="ml-3 bg-white/20 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      이번 달 +{data.thisMonthMembers}명 신규
                    </span>
                  )}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                {quickActions.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-all text-center min-w-[72px]"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
            {/* 배경 장식 */}
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -right-4 -bottom-12 w-64 h-64 rounded-full bg-white/5" />
          </div>

          {/* 스탯 카드 4개 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map(({ title, value, sub, icon: Icon, gradient, growth, growthLabel }) => (
              <div key={title} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {growth !== null && growthLabel && (
                    <GrowthBadge value={growth} />
                  )}
                </div>
                <p className="text-3xl font-bold text-slate-800 tabular-nums">{value}</p>
                <p className="text-sm font-semibold text-slate-600 mt-1">{title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* 차트 섹션 (클라이언트 컴포넌트) */}
          <DashboardCharts data={data.chartData} />

          {/* 하단 2컬럼 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* 다가오는 이벤트 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <h3 className="text-sm font-bold text-slate-700">다가오는 이벤트</h3>
                <Link href="/events" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-semibold">
                  전체보기 <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {data.upcomingEvents.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <CalendarCheck className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400">예정된 이벤트가 없습니다.</p>
                  </div>
                ) : (
                  data.upcomingEvents.map((event) => {
                    const typeConf = EVENT_TYPE_CONFIG[event.type] ?? EVENT_TYPE_CONFIG.other;
                    const d = new Date(event.date);
                    return (
                      <div key={String(event._id)} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                        <div className="w-11 h-11 bg-blue-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] text-blue-400 font-semibold uppercase leading-none">
                            {d.toLocaleDateString("ko-KR", { month: "short" }).replace("월","M")}
                          </span>
                          <span className="text-lg font-black text-blue-600 leading-tight">{d.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">{event.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {d.toLocaleDateString("ko-KR", { weekday: "long" })}
                          </p>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${typeConf.color}`}>
                          {typeConf.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 최근 가입 회원 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                <h3 className="text-sm font-bold text-slate-700">최근 가입 회원</h3>
                <Link href="/members" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-semibold">
                  전체보기 <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {data.recentMembers.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400">등록된 회원이 없습니다.</p>
                  </div>
                ) : (
                  data.recentMembers.map((member) => {
                    const belt = member.belt as string ?? "white";
                    const initial = (member.name as string).charAt(0);
                    const AVATAR_COLORS = ["bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700", "bg-emerald-100 text-emerald-700", "bg-orange-100 text-orange-700", "bg-pink-100 text-pink-700"];
                    const colorIdx = initial.charCodeAt(0) % AVATAR_COLORS.length;
                    return (
                      <div key={String(member._id)} className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${AVATAR_COLORS[colorIdx]}`}>
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-700 truncate">{member.name as string}</p>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[member.status as string] ?? "bg-slate-400"}`} />
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(member.joinedAt as Date).toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`w-2.5 h-2.5 rounded-full ${BELT_COLORS[belt]}`} />
                          <span className="text-xs font-medium text-slate-500">{BELT_LABELS[belt]}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 연체 알림 */}
          {data.overdueTuition > 0 && (
            <div className="flex items-center gap-4 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700">수강료 연체 알림</p>
                <p className="text-xs text-red-400 mt-0.5">
                  현재 <span className="font-bold">{data.overdueTuition}건</span>의 수강료가 연체되어 있습니다. 빠른 조치가 필요합니다.
                </p>
              </div>
              <Link
                href="/tuition"
                className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-white border border-red-200 hover:border-red-300 rounded-xl px-4 py-2 transition-all shrink-0"
              >
                확인 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
