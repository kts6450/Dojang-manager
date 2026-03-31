"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
}

const PAGE_TITLES: Record<string, string> = {
  "/": "대시보드",
  "/crm": "CRM / 리드 관리",
  "/members": "회원 관리",
  "/attendance": "출결 관리",
  "/tuition": "수강료 관리",
  "/belt-rank": "승급 관리",
  "/inventory": "재고 관리",
  "/contracts": "계약서",
  "/online-classes": "온라인 수업",
  "/after-school": "방과후",
  "/events": "이벤트",
  "/reports": "리포트",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  instructor: "강사",
  member: "회원",
  student: "학생",
};

function useDateString() {
  const now = new Date();
  return now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const dateStr = useDateString();

  const isHome = pathname === "/";
  const pageLabel = PAGE_TITLES[pathname] ?? title;

  const roleLabel = ROLE_LABELS[session?.user?.role ?? ""] ?? "관리자";
  const userName = session?.user?.name ?? "관리자";
  const userInitial = userName.charAt(0);

  return (
    <header className="h-[60px] flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm border-b border-slate-200/80 shrink-0 sticky top-0 z-10">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-1.5 text-sm">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-1 transition-colors",
            isHome ? "text-blue-600 font-semibold" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Home className="w-3.5 h-3.5" />
          {isHome && <span>대시보드</span>}
        </Link>
        {!isHome && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-semibold text-slate-700">{pageLabel}</span>
          </>
        )}
      </div>

      {/* 우측 영역 */}
      <div className="flex items-center gap-3">
        {/* 날짜 */}
        <span className="hidden md:block text-xs text-slate-400 font-medium">{dateStr}</span>

        {/* 구분선 */}
        <div className="hidden md:block w-px h-5 bg-slate-200" />

        {/* 알림 버튼 */}
        <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
          <Bell className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-white" />
        </button>

        {/* 사용자 정보 */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="hidden sm:block text-right">
            <p className="text-[13px] font-semibold text-slate-700 leading-tight">{userName}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{roleLabel}</p>
          </div>
          <Avatar className="w-8 h-8 ring-2 ring-blue-100">
            <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
