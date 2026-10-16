"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock
} from "lucide-react";
import { PORTFOLIO_DATA, MilestoneItem } from "./portfolioData";

export default function DevelopmentJourneySection() {
  const [expandedStep, setExpandedStep] = useState<string>("01");

  return (
    <section id="journey" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level 8: Engineering Methodology</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            12-Stage Development Journey
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            The chronological progression of how GourmetOS was planned, architected, secured, and refined.
          </p>
        </div>

        {/* 12-Step Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PORTFOLIO_DATA.journey.map((m) => {
            const isExpanded = expandedStep === m.step;
            return (
              <div
                key={m.step}
                onClick={() => setExpandedStep(isExpanded ? "" : m.step)}
                className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isExpanded
                    ? "bg-slate-900/90 border-emerald-400 shadow-lg shadow-emerald-500/10 scale-[1.01]"
                    : "bg-slate-900/50 hover:bg-slate-900/80 border-slate-800 hover:border-emerald-500/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="shrink-0 whitespace-nowrap font-mono text-xl font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                      {m.step}
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {m.focus}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-2 flex items-center justify-between">
                    <span>{m.title}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </h3>
                </div>

                <div className={`space-y-2 mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 ${isExpanded ? "block" : "hidden sm:block sm:line-clamp-2"}`}>
                  {m.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
