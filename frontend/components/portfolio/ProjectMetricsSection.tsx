"use client";

import React from "react";
import { Sparkles, CheckCircle2, ShieldCheck, Database, Layers, Smartphone } from "lucide-react";
import { PORTFOLIO_DATA } from "./portfolioData";

export default function ProjectMetricsSection() {
  return (
    <section className="py-16 relative border-t border-slate-800/60 bg-slate-950/40">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block mb-2">
            Verified Codebase Analytics
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Truthful Architectural Metrics
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Metrics extracted directly through project code inspection. No fabricated user counts or synthetic statistics.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {PORTFOLIO_DATA.metrics.map((m, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/60 border border-emerald-500/20 text-center flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-tight mb-1">
                  {m.value}
                </div>
                <div className="text-xs font-bold text-slate-200 leading-snug">
                  {m.label}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-slate-800">
                {m.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
