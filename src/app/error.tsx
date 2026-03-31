"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <h2 className="text-[15px] font-semibold text-slate-800">Something went wrong</h2>
        <p className="text-[13px] text-slate-500 font-mono bg-slate-100 rounded-md p-3 text-left break-all">
          {error.message || "Unknown error"}
        </p>
        {error.digest && (
          <p className="text-[11px] text-slate-400">Digest: {error.digest}</p>
        )}
        <div className="flex gap-2 justify-center">
          <Button size="sm" onClick={reset}>Try Again</Button>
          <Button size="sm" variant="outline" onClick={() => window.location.href = "/"}>Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
