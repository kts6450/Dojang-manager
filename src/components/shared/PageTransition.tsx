"use client";

/** Wraps main content only. Avoids inline opacity/DOM hacks that conflict with Radix Portals (removeChild errors). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      {children}
    </div>
  );
}
