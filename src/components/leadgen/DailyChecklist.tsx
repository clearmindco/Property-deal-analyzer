"use client";

import { useState } from "react";

export function DailyChecklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  return (
    <ul className="mt-3 flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={checked[i] ?? false}
            onChange={(e) => setChecked((c) => ({ ...c, [i]: e.target.checked }))}
          />
          <span className={checked[i] ? "text-text-secondary line-through" : "text-text-primary"}>{item}</span>
        </li>
      ))}
    </ul>
  );
}
