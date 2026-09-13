"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/getting-started", label: "Getting Started" },
  { href: "/learn", label: "Education Center" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/deals", label: "Deals" },
  { href: "/leadgen", label: "Lead Gen" },
  { href: "/leads", label: "Leads" },
  { href: "/lenders", label: "Lenders" },
  { href: "/contacts", label: "Contacts" },
  { href: "/mentor", label: "AI Mentor" },
  { href: "/course-rules", label: "Course Rules" },
  { href: "/settings/company", label: "Company Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-56 flex-col border-r border-silver/40 bg-card px-4 py-6 md:flex">
      <Link href="/dashboard" className="mb-8 block text-lg font-bold text-navy">
        Deal Analyzer
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-card px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-soft-blue text-navy" : "text-slate hover:bg-soft-blue/60"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
