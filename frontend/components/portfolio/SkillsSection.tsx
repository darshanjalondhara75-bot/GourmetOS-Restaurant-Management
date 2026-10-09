"use client";

import React, { useState } from "react";
import {
  Code2,
  Server,
  Layers,
  Database,
  Shield,
  Smartphone,
  Cpu,
  Sparkles,
  CheckCircle2,
  Zap
} from "lucide-react";
import { PORTFOLIO_DATA, SkillItem } from "./portfolioData";

type CategoryFilter = "all" | "backend" | "frontend" | "database" | "architecture";

export default function SkillsSection() {
  const [activeTab, setActiveTab] = useState<CategoryFilter>("all");

  const categories = [
    { id: "all", label: "All Skills" },
    { id: "backend", label: "Python & Backend" },
    { id: "frontend", label: "Next.js & Frontend" },
    { id: "database", label: "Database & Storage" },
    { id: "architecture", label: "Architecture & Systems" },
  ];

  const filteredSkills = PORTFOLIO_DATA.skills.filter((skill) => {
    if (activeTab === "all") return true;
    return skill.category === activeTab;
  });

  return (
    <section id="skills" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level 2: Technical Competencies</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Technical Skills &amp; Technology Stack
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Every technology listed below is actively implemented and verified within the GourmetOS restaurant management codebase.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id as CategoryFilter)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === cat.id
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                  : "bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-emerald-500/20"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSkills.map((skill, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-emerald-500/15 hover:border-emerald-500/40 transition-all duration-300 group flex flex-col justify-between shadow-sm hover:shadow-lg hover:shadow-emerald-500/5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                    {skill.level}
                  </span>
                  {skill.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded-full border border-teal-500/30">
                      {skill.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{skill.name}</span>
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {skill.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="capitalize">{skill.category}</span>
                <span className="text-emerald-400 font-mono">Verified in Project</span>
              </div>
            </div>
          ))}
        </div>

        {/* Skill Matrix Summary Box */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-emerald-500/20 backdrop-blur-md">
          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Architecture &amp; Design Summary</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs sm:text-sm">
            <div>
              <div className="font-semibold text-slate-100 mb-1">Backend Runtime</div>
              <div className="text-slate-300">Python 3 + FastAPI asynchronous event loop running with Uvicorn ASGI server.</div>
            </div>
            <div>
              <div className="font-semibold text-slate-100 mb-1">Frontend Framework</div>
              <div className="text-slate-300">Next.js 16 with React 19, TypeScript 5, and App Router architecture.</div>
            </div>
            <div>
              <div className="font-semibold text-slate-100 mb-1">Data Layer</div>
              <div className="text-slate-300">MongoDB with Motor async driver and optimized indexes for fast reads.</div>
            </div>
            <div>
              <div className="font-semibold text-slate-100 mb-1">State &amp; Real-Time</div>
              <div className="text-slate-300">Server-Sent Events (SSE) with token validation and custom Context providers.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
