"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Building2, ChevronDown, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useBranch } from "@/contexts/BranchContext";

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Studio performance at a glance." },
  "/crm": { title: "CRM / Leads", description: "Track prospects and conversion pipeline." },
  "/members": { title: "Members", description: "Manage active, inactive, and trial members." },
  "/attendance": { title: "Attendance", description: "Check-ins, QR scans, and daily summaries." },
  "/tuition": { title: "Tuition", description: "Billing, payment status, and overdue accounts." },
  "/belt-rank": { title: "Belt & Rank", description: "Promotions, testing dates, and progressions." },
  "/inventory": { title: "Inventory", description: "Gear, uniforms, and stock levels." },
  "/contracts": { title: "Contracts", description: "Active agreements and upcoming renewals." },
  "/online-classes": { title: "Online Classes", description: "Virtual sessions and content library." },
  "/after-school": { title: "After School", description: "Program enrollment and schedules." },
  "/events": { title: "Events", description: "Tournaments, seminars, and studio events." },
  "/reports": { title: "Reports", description: "Analytics and performance insights." },
  "/admin/reports": { title: "HQ Reports", description: "Cross-branch consolidated analytics." },
};

const ROLE_LABELS: Record<string, string> = {
  HQ_ADMIN: "본사 관리자",
  BRANCH_ADMIN: "지점 관리자",
  MEMBER: "회원",
  STUDENT: "학생",
};

export function Header({ title }: { title: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { branches, selectedBranchId, selectedBranch, setSelectedBranchId } = useBranch();

  const isHQ = session?.user?.role === "HQ_ADMIN";
  const meta = PAGE_META[pathname] ?? { title, description: "" };
  const roleLabel = ROLE_LABELS[session?.user?.role ?? ""] ?? "Admin";
  const userName = session?.user?.name ?? "Admin";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-10 shrink-0 h-14 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      {/* Page title */}
      <div className="flex items-baseline gap-3 min-w-0">
        <h1 className="text-[15px] font-semibold text-slate-900 leading-none shrink-0">
          {meta.title}
        </h1>
        {meta.description && (
          <span className="hidden md:block text-[12.5px] text-slate-400 truncate leading-none">
            {meta.description}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">

        {/* HQ_ADMIN Branch Selector */}
        {isHQ && (
          <div className="relative group">
            <select
              value={selectedBranchId ?? ""}
              onChange={(e) => setSelectedBranchId(e.target.value || null)}
              className="h-8 appearance-none pl-7 pr-7 rounded-md border border-slate-200 bg-slate-50 text-[12px] text-slate-700 font-medium hover:bg-slate-100 hover:border-indigo-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors cursor-pointer min-w-[140px]"
            >
              <option value="">전체 지점</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Building2 className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-500 pointer-events-none" strokeWidth={1.5} />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" strokeWidth={2} />
          </div>
        )}

        {/* BRANCH_ADMIN: show branch badge */}
        {session?.user?.role === "BRANCH_ADMIN" && (
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-200 bg-slate-50">
            <Building2 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
            <span className="text-[12px] text-slate-600 font-medium">
              {selectedBranch?.name ?? "내 지점"}
            </span>
          </div>
        )}

        {/* Search */}
        <button className="hidden xl:flex items-center gap-2 h-8 rounded-md border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-colors min-w-[160px]">
          <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span className="flex-1 text-left">Search</span>
          <kbd className="ml-auto flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] font-medium text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Notification */}
        <button
          className="relative h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-1 ring-white" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 h-8 pl-1 pr-2.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors cursor-default">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left leading-none">
            <p className="text-[12px] font-semibold text-slate-900">{userName}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
