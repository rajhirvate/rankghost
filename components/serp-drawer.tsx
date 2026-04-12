"use client";

import { SerpResult } from "@/lib/types";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  keyword: string;
  domain: string;
  currentRank: number | null;
  results: SerpResult[];
};

export function SerpDrawer({ open, onClose, keyword, domain, currentRank, results }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-black/[0.07] shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">SERP Results</p>
            <h2 className="font-display text-base font-semibold text-slate-900 leading-snug truncate" title={keyword}>
              {keyword}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{domain}</p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 shrink-0 flex items-center justify-center h-8 w-8 rounded-lg border border-black/[0.07] text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Rank summary strip */}
        <div className="px-6 py-3 border-b border-black/[0.07] bg-[#FAFAF7] shrink-0 flex items-center gap-6">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Your Position</p>
            <p className={`text-lg font-black font-mono ${currentRank ? (currentRank <= 10 ? "text-[#39ff14]" : currentRank <= 30 ? "text-amber-500" : "text-red-500") : "text-slate-400"}`}>
              {currentRank ? `#${currentRank}` : "Not found"}
            </p>
          </div>
          <div className="h-8 w-px bg-black/[0.07]" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Top 10 shown</p>
            <p className="text-lg font-black font-mono text-slate-700">{results.length}</p>
          </div>
          <div className="h-8 w-px bg-black/[0.07]" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Target</p>
            <p className="text-xs font-semibold text-slate-700 font-mono truncate max-w-[120px]">{domain}</p>
          </div>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-slate-500 text-sm font-medium mb-1">No results yet</p>
              <p className="text-slate-400 text-xs">Run a check on this keyword to see the top 10 SERP results.</p>
            </div>
          ) : (
            results.map((r) => (
              <a
                key={r.position}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex gap-3 rounded-xl p-4 border transition-all duration-150 hover:shadow-sm ${
                  r.isTarget
                    ? "border-[#39ff14]/30 bg-[#39ff14]/[0.04] hover:bg-[#39ff14]/[0.07]"
                    : "border-black/[0.06] bg-white hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                {/* Position badge */}
                <div className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                  r.isTarget
                    ? "bg-[#39ff14] text-black"
                    : r.position <= 3
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {r.position}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-snug line-clamp-2 ${r.isTarget ? "text-slate-900" : "text-slate-800"}`}>
                      {r.title}
                    </p>
                    <svg className="shrink-0 h-3.5 w-3.5 text-slate-300 group-hover:text-slate-400 mt-0.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{r.displayUrl}</p>
                  {r.snippet && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{r.snippet}</p>
                  )}
                  {r.isTarget && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-[#39ff14] uppercase tracking-widest">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#39ff14]" />
                      Your domain
                    </span>
                  )}
                </div>
              </a>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-black/[0.07] bg-[#FAFAF7] shrink-0">
          <p className="text-[10px] text-slate-400 text-center">
            Showing top {results.length} organic results · Click any result to open
          </p>
        </div>
      </div>
    </>
  );
}
