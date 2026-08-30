"use client";

import { useState } from "react";

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={i} className="dgs-card !py-0 overflow-hidden">
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full flex items-center justify-between gap-3 py-4 text-left"
            >
              <span className="text-neutral-100 text-sm font-medium">{item.q}</span>
              <span className={`text-brand text-lg shrink-0 transition-transform ${open ? "rotate-45" : ""}`}>+</span>
            </button>
            {open && <p className="text-neutral-500 text-sm leading-relaxed pb-4">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
