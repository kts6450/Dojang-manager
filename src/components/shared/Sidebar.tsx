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

export const navGroups = [
  {
    label: "Home",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/crm", label: "CRM / Leads", icon: Target },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/members", label: "Members", icon: Users },
      { href: "/attendance", label: "Attendance", icon: CalendarCheck },
      { href: "/tuition", label: "Tuition", icon: CreditCard },
      { href: "/belt-rank", label: "Belt & Rank", icon: Award },
      { href: "/contracts", label: "Contracts", icon: FileText },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/online-classes", label: "Online Classes", icon: BookOpen },
      { href: "/after-school", label: "After School", icon: GraduationCap },
      { href: "/events", label: "Events", icon: CalendarDays },
      { href: "/inventory", label: "Inventory", icon: Package },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
];

// HQ_ADMIN only: additional nav group
const HQ_NAV_GROUP = {
  label: "본사 전용",
  items: [
    { href: "/admin/reports", label: "통합 리포트", icon: BarChart3 },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  HQ_ADMIN: "본사 관리자",
  BRANCH_ADMIN: "지점 관리자",
  MEMBER: "회원",
  STUDENT: "학생",
};

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "Admin";
  const userRole = session?.user?.role ?? "HQ_ADMIN";
  const userInitial = userName.charAt(0).toUpperCase();
  const isHQ = userRole === "HQ_ADMIN";
  const allGroups = isHQ ? [...navGroups, HQ_NAV_GROUP] : navGroups;

  return (
    <>
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {allGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <p className="px-4 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400/80 select-none">
                {group.label}
              </p>
            )}
            {collapsed && <div className="mx-3 my-2 h-px bg-slate-100" />}
            <ul className="space-y-px px-2">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      title={collapsed ? label : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-all duration-100",
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon
                        strokeWidth={isActive ? 2 : 1.5}
                        className={cn(
                          "w-[17px] h-[17px] shrink-0 transition-colors",
                          isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      {!collapsed && <span className="truncate">{label}</span>}
                      {isActive && !collapsed && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 pt-3 pb-4 border-t border-slate-100 space-y-1">
        <div
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2.5 rounded-md hover:bg-slate-100 transition-colors cursor-default",
            collapsed ? "justify-center" : ""
          )}
        >
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">{userName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-2.5 h-2.5 text-slate-400" strokeWidth={1.5} />
                <p className="text-[10.5px] text-slate-400 leading-tight">{ROLE_LABELS[userRole] ?? userRole}</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-100",
            collapsed ? "justify-center" : ""
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-[17px] h-[17px] shrink-0" strokeWidth={1.5} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col border-r border-slate-200 bg-white transition-all duration-300 min-h-screen",
        collapsed ? "w-[60px]" : "w-[232px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 h-14 border-b border-slate-100",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
          <span className="text-[11px] font-bold text-white tracking-tight">DM</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-semibold text-[14.5px] text-slate-900 leading-none tracking-tight">Dojang Manager</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[17px] z-20 w-6 h-6 border border-slate-200 bg-white text-slate-400 rounded-full flex items-center justify-center shadow-sm transition-colors hover:text-slate-700 hover:border-slate-300"
        aria-label={collapsed ? "Expand menu" : "Collapse menu"}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" strokeWidth={2} />
        ) : (
          <ChevronLeft className="w-3 h-3" strokeWidth={2} />
        )}
      </button>

      <SidebarNav collapsed={collapsed} />
    </aside>
  );
}
