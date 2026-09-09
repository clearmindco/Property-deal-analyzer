"use client";

export function InfoTooltip({ text, label }: { text: string; label?: string }) {
  return (
    <span className="group relative inline-flex items-center ml-1 align-middle">
      <span
        tabIndex={0}
        aria-label={label ?? "More information"}
        className="tooltip-trigger inline-flex h-4 w-4 items-center justify-center rounded-full border border-silver text-[10px] text-slate font-semibold"
      >
        ?
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-card bg-navy px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
