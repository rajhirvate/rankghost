"use client";

import { useState } from "react";

type FaqItem = { q: string; a: string };

export function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {faqs.map((item, i) => (
        <div
          key={i}
          className={`overflow-hidden rounded-[24px] border transition-all duration-300 ${
            open === i 
              ? "border-[#39ff14]/30 bg-[#39ff14]/5 shadow-[0_0_20px_rgba(57,255,20,0.05)]" 
              : "border-white/5 bg-transparent hover:border-white/10"
          }`}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-7 py-5 text-left group"
          >
            <span className={`font-bold transition-colors ${open === i ? "text-[#39ff14]" : "text-slate-300 group-hover:text-white"}`}>
              {item.q}
            </span>
            <div
              className={`ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                open === i 
                  ? "border-[#39ff14] bg-[#39ff14] text-black rotate-45" 
                  : "border-white/10 text-slate-500 group-hover:border-white/20"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </button>
          
          <div 
            className={`transition-all duration-300 ease-in-out ${
              open === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-7 pb-6 text-sm leading-relaxed text-slate-400 border-t border-white/5 pt-4">
              {item.a}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
