"use client";

import { useMode } from "@/lib/mode-context";

export function ModeToggle() {
  const { mode, setMode } = useMode();
  return (
    <div className="flex items-center rounded-full border border-silver/50 bg-soft-blue p-0.5 text-xs font-medium">
      <button
        onClick={() => setMode("simple")}
        className={`rounded-full px-3 py-1 transition-colors ${mode === "simple" ? "bg-primary-blue text-white" : "text-navy"}`}
      >
        Simple
      </button>
      <button
        onClick={() => setMode("pro")}
        className={`rounded-full px-3 py-1 transition-colors ${mode === "pro" ? "bg-primary-blue text-white" : "text-navy"}`}
      >
        Pro
      </button>
    </div>
  );
}
