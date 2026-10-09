"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Smartphone,
  SunMoon,
  Compass,
  Cpu,
  Layers,
  FileCheck2,
  HelpCircle
} from "lucide-react";
import { PORTFOLIO_DATA, CaseStudyItem } from "./portfolioData";

export default function ProblemsSolvedSection() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>("responsive");

  const activeCase = PORTFOLIO_DATA.caseStudies.find((c) => c.id === selectedCaseId) || PORTFOLIO_DATA.caseStudies[0];

  return (
    <section id="case-study" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level 7: Technical Case Study</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Real Engineering Challenges &amp; Solutions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Practical architectural challenges encountered during GourmetOS development and the exact engineering
            decisions made to solve them.
          </p>
        </div>

        {/* Case Study Switcher Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {PORTFOLIO_DATA.caseStudies.map((item) => {
            const isSelected = item.id === selectedCaseId;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedCaseId(item.id)}
                className={`p-5 rounded-2xl text-left transition-all duration-300 border flex flex-col justify-between ${
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-400 text-slate-100 shadow-lg shadow-emerald-500/20 scale-[1.02]"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 hover:border-emerald-500/30"
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 inline-block mb-2">
                    {item.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug mb-2">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-2">
                  <span>View Case Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Case Study Card */}
        <div className="p-6 sm:p-8 lg:p-10 rounded-3xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-800 mb-8">
            <div>
              <span className="text-xs uppercase font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 inline-block mb-2">
                {activeCase.category}
              </span>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-100">
                {activeCase.title}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Case ID: #{activeCase.id}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* 1. Problem Definition */}
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-3">
                <AlertTriangle className="w-4 h-4" />
                <span>The Engineering Problem</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeCase.problem}
              </p>
            </div>

            {/* 2. Root Cause Analysis */}
            <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
                <HelpCircle className="w-4 h-4" />
                <span>Root Cause Analysis</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeCase.analysis}
              </p>
            </div>

            {/* 3. Implemented Solution */}
            <div className="p-6 rounded-2xl bg-emerald-950/25 border border-emerald-500/35">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>Engineered Solution</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeCase.solution}
              </p>
            </div>
          </div>

          {/* Verified Technical Impact Box */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Verified Outcome &amp; Project Impact
              </span>
              <p className="text-xs sm:text-sm text-slate-200">{activeCase.verifiedImpact}</p>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Production Tested</span>
            </div>
          </div>

          {/* Special Visual Spotlight for Theme Contrast Case */}
          {activeCase.id === "theme-contrast" && (
            <div className="mt-8 pt-8 border-t border-slate-800">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
                Visual Proof: High-Contrast Error State Verified in Light &amp; Dark Modes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs font-mono text-emerald-400 mb-2">Dark Mode Error Dialog Verification</div>
                  <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-slate-800">
                    <Image
                      src="/images/login_error_verified.png"
                      alt="Dark mode login error verification"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-300">
                  <div className="text-xs font-mono text-emerald-800 mb-2 font-bold">
                    Light Mode High-Contrast Verification
                  </div>
                  <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-slate-300">
                    <Image
                      src="/images/login_error_light_verified.png"
                      alt="Light mode login error verification"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
