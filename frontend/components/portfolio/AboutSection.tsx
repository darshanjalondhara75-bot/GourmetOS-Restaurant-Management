"use client";

import React from "react";
import {
  Server,
  LayoutDashboard,
  ShieldCheck,
  UtensilsCrossed,
  Layers,
  Smartphone,
  Cpu,
  Clock,
  Sparkles,
  Database
} from "lucide-react";
import { PORTFOLIO_DATA } from "./portfolioData";

export default function AboutSection() {
  const pillars = [
    {
      icon: Server,
      title: "Python Backend Architecture",
      desc: "Engineered high-performance async REST services with FastAPI, Pydantic v2 data models, and Motor MongoDB driver for restaurant data integrity.",
    },
    {
      icon: LayoutDashboard,
      title: "Next.js Frontend Engineering",
      desc: "Built dynamic client interfaces using Next.js 16 App Router, React 19, and TypeScript with fluid navigation and responsive layouts.",
    },
    {
      icon: ShieldCheck,
      title: "Role-Based Panel Architecture",
      desc: "Structured strict access control separating Admin Command, Chef Line, Cashier POS, and Customer Dining panels with PyJWT tokens.",
    },
    {
      icon: UtensilsCrossed,
      title: "Restaurant Operations Workflows",
      desc: "Designed complete touchless dining journeys: table reservations, QR session ordering, kitchen ticket boards, and cashier billing.",
    },
    {
      icon: Database,
      title: "Inventory & Audit Systems",
      desc: "Implemented two-tier inventory auditing connecting chef physical counts and administrative variance verification for raw ingredient tracking.",
    },
    {
      icon: Smartphone,
      title: "Cross-Device Responsive UI",
      desc: "Optimized interfaces from 320px mobile screens to desktop displays using emerald liquid-glass tokens and high-contrast light/dark themes.",
    },
  ];

  return (
    <section id="about" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level 1: Professional Background</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            About My Work &amp; Engineering Focus
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            I am a full-stack developer dedicated to building real, robust software solutions. My work centers on
            combining Python backend engineering with modern Next.js frontend interfaces to solve operational challenges.
          </p>
        </div>

        {/* Narrative & Focus Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Detailed Biography (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-slate-900/60 dark:bg-slate-900/80 border border-emerald-500/20 backdrop-blur-md min-w-0">
            <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="min-w-0 break-words">Engineering Philosophy &amp; Experience</span>
            </h3>
            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed break-words">
              <p>
                My development experience is demonstrated through the creation of{" "}
                <strong className="text-slate-100 font-semibold">GourmetOS</strong>, a comprehensive restaurant
                management and ordering system. Rather than building static showcase pages, I engineered an operational
                product with complete end-to-end workflows.
              </p>
              <p>
                On the backend, I leverage <strong className="text-emerald-400 font-semibold">Python and FastAPI</strong> to
                construct asynchronous, type-safe endpoints. I implement strict validation schemas with Pydantic, manage
                MongoDB collections through Motor, and ensure authentication through JSON Web Tokens (PyJWT) with
                automatic refresh lifecycles.
              </p>
              <p>
                On the frontend, I utilize <strong className="text-emerald-400 font-semibold">Next.js 16 and TypeScript</strong>{" "}
                to develop responsive, role-segregated dashboards. My focus is on user experience, state persistence,
                and seamless theme consistency across mobile, tablet, and desktop viewports.
              </p>
            </div>
          </div>

          {/* Core Pillars Quick List (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-emerald-500/15 backdrop-blur-md">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4">
              Core Technical Competencies
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              {[
                "Python FastAPI backend REST architecture",
                "Next.js App Router & React 19 interface development",
                "Four role-based operational panel segregation",
                "Real-time multi-terminal event streaming via SSE",
                "Touchless QR-code ordering & table booking lifecycles",
                "Two-tier kitchen inventory auditing & admin approval",
                "Emerald liquid-glass design system with light/dark modes",
                "100% responsive fluid layouts across all viewports",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 6 Capabilities Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/50 hover:bg-slate-900/80 border border-emerald-500/15 hover:border-emerald-500/35 transition-all duration-300 group hover:-translate-y-1 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-100 mb-2">{pillar.title}</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
