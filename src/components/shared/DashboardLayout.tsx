"use client";

import { useState } from "react";
import { Sidebar, SidebarNav } from "./Sidebar";
import { PageTransition } from "./PageTransition";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] bg-[#fcfcfd] p-0 border-r border-slate-200">
          <VisuallyHidden.Root>
            <SheetTitle>Menu</SheetTitle>
          </VisuallyHidden.Root>
          <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-100">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-[11px] font-bold text-white tracking-tight">DM</span>
            </div>
            <p className="font-semibold text-[14.5px] text-slate-900 leading-none tracking-tight">Dojang Manager</p>
          </div>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-slate-200 bg-white">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:text-slate-900"
            aria-label="Open menu"
          >
            <Menu className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 shadow-sm">
              <span className="text-[10px] font-bold text-white">DM</span>
            </div>
            <span className="font-semibold text-[14px] text-slate-900 tracking-tight">Dojang Manager</span>
          </div>
        </div>
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
