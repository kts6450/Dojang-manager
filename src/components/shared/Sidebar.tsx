"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  Award,
  Package,
  FileText,
  BookOpen,
  GraduationCap,
  CalendarDays,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Target,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navGroups = [
  {
    label: "홈",
    items: [
      { href: "/", label: "대시보드", icon: LayoutDashboard },
    ],
  },
  {
    label: "성장 관리",
    items: [
      { href: "/crm", label: "CRM / 리드", icon: Target },
    ],
  },
  {
    label: "운영 관리",
    items: [
      { href: "/members", label: "회원 관리", icon: Users },
      { href: "/attendance", label: "출결 관리", icon: CalendarCheck },
      { href: "/tuition", label: "수강료 관리", icon: CreditCard },
      { href: "/belt-rank", label: "승급 관리", icon: Award },
      { href: "/contracts", label: "계약서", icon: FileText },
    ],
  },
  {
    label: "콘텐츠 · 시설",
    items: [
      { href: "/online-classes", label: "온라인 수업", icon: BookOpen },
      { href: "/after-school", label: "방과후", icon: GraduationCap },
      { href: "/events", label: "이벤트", icon: CalendarDays },
      { href: "/inventory", label: "재고 관리", icon: Package },
    ],
  },
  {
    label: "분석",
    items: [
      { href: "/reports", label: "리포트", icon: BarChart3 },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  instructor: "강사",
  member: "회원",
  student: "학생",
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const userName = session?.user?.name ?? "관리자";
  const userRole = session?.user?.role ?? "admin";
  const userInitial = userName.charAt(0);

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-slate-950 text-white transition-all duration-300 min-h-screen",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* 로고 */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-white/8",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
          <span className="text-base leading-none">🥋</span>
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-[15px] text-white leading-tight">도장 매니저</p>
            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">무도관 통합 관리</p>
          </div>
        )}
      </div>

      {/* 토글 버튼 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[22px] z-20 w-6 h-6 bg-slate-700 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
        aria-label={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* 네비게이션 */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                {group.label}
              </p>
            )}
            {collapsed && <div className="mx-3 my-2 h-px bg-white/8" />}
            <ul className="space-y-0.5 px-2">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      title={collapsed ? label : undefined}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                        isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-900/50"
                          : "text-slate-400 hover:bg-white/8 hover:text-white"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-[18px] h-[18px] shrink-0 transition-colors",
                          isActive ? "text-white" : "text-slate-500 group-hover:text-white"
                        )}
                      />
                      {!collapsed && <span>{label}</span>}
                      {isActive && !collapsed && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* 하단 사용자 프로필 + 로그아웃 */}
      <div className="px-2 pt-3 pb-4 border-t border-white/8 space-y-1">
        {/* 유저 프로필 */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-lg",
            collapsed ? "justify-center" : ""
          )}
        >
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-200 truncate">{userName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-2.5 h-2.5 text-blue-400" />
                <p className="text-[10px] text-slate-500">{ROLE_LABELS[userRole] ?? userRole}</p>
              </div>
            </div>
          )}
        </div>

        {/* 로그아웃 */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all",
            collapsed ? "justify-center" : ""
          )}
          title={collapsed ? "로그아웃" : undefined}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  );
}
