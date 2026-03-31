"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";

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
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  instructor: "Instructor",
  member: "Member",
  student: "Student",
};

export function Header({ title }: { title: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();

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
        {/* Search */}
        <button className="hidden xl:flex items-center gap-2 h-8 rounded-md border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-colors min-w-[180px]">
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
