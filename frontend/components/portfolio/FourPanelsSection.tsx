"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldAlert,
  ChefHat,
  CreditCard,
  Utensils,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { PORTFOLIO_DATA } from "./portfolioData";

export default function FourPanelsSection() {
  const [activePanelId, setActivePanelId] = useState<"admin" | "chef" | "cashier" | "customer">("admin");

  const panelIcons = {
    admin: ShieldAlert,
    chef: ChefHat,
    cashier: CreditCard,
    customer: Utensils,
  };

  const activePanel = PORTFOLIO_DATA.panels.find((p) => p.id === activePanelId) || PORTFOLIO_DATA.panels[0];
  const ActiveIcon = panelIcons[activePanel.id];
  const demoRoute = `${activePanel.route}${activePanel.route.includes("?") ? "&" : "?"}portfolioDemo=1`;

  return (
    <section id="panels" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level 5: Four-Panel Experience</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Dedicated Role-Based Workspaces
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            GourmetOS partitions responsibilities into four purpose-built panels, each engineered to address the specific
            demands of its operational persona.
          </p>
        </div>

        {/* Panel Selection Tabs */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-10"
          role="tablist"
          aria-label="Restaurant panels"
        >
          {PORTFOLIO_DATA.panels.map((panel) => {
            const Icon = panelIcons[panel.id];
            const isSelected = panel.id === activePanelId;
            return (
              <div
                key={panel.id}
                className={`p-4 sm:p-5 rounded-2xl transition-all duration-300 border ${
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-400 text-slate-100 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 hover:border-emerald-500/30"
                }`}
              >
                <button
                  type="button"
                  role="tab"
                  id={`panel-tab-${panel.id}`}
                  aria-selected={isSelected}
                  aria-controls="panel-preview"
                  onClick={() => setActivePanelId(panel.id)}
                  className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSelected ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-emerald-400 text-slate-950"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {panel.id}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 mb-0.5">{panel.name}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{panel.roleTitle}</p>
                  </div>
                </button>
                <Link
                  href={`${panel.route}${panel.route.includes("?") ? "&" : "?"}portfolioDemo=1`}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-500/25 bg-slate-950/40 px-3 text-xs font-semibold text-emerald-300 transition-colors hover:border-emerald-400/60 hover:bg-emerald-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Visit {panel.id} demo
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Active Panel Deep-Dive Card */}
        <div
          id="panel-preview"
          role="tabpanel"
          aria-labelledby={`panel-tab-${activePanel.id}`}
          className="p-4 sm:p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl shadow-2xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Panel Overview, Features, Dev Work (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs uppercase font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    {activePanel.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{activePanel.route}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mb-3 flex items-center gap-3">
                  <ActiveIcon className="w-7 h-7 text-emerald-400" />
                  <span>{activePanel.name}</span>
                </h3>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                  {activePanel.summary}
                </p>

                {/* User Flow */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/20 mb-6 text-xs sm:text-sm">
                  <span className="font-bold text-emerald-400 block mb-1">Operational Flow:</span>
                  <span className="text-slate-300">{activePanel.userFlow}</span>
                </div>

                {/* Verified Key Features */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                    Verified Panel Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activePanel.keyFeatures.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-slate-200"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* My Development Work */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                    My Technical Development Responsibilities
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                    {activePanel.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Live Link */}
              <div className="pt-4 border-t border-slate-800 flex items-center gap-4">
                <Link
                  href={demoRoute}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all"
                >
                  <span>Open {activePanel.name} Demo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <span className="text-xs text-slate-400 font-mono">
                  Route: {activePanel.route}
                </span>
              </div>
            </div>

            {/* Right Column: Screenshot & Tech Badges (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-950 shadow-xl">
                <Image
                  src={activePanel.screenshot}
                  alt={`${activePanel.name} screenshot`}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 500px"
                  className="object-contain"
                />
              </div>

              <p className="w-full mt-3 mb-4 text-xs leading-relaxed text-slate-400">
                <span className="font-semibold text-slate-200">{activePanel.name}:</span>{" "}
                {activePanel.screenshotCaption}
              </p>

              <div className="w-full p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div className="font-semibold text-slate-300 mb-2">Panel Technologies:</div>
                <div className="flex flex-wrap gap-1.5">
                  {activePanel.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-slate-900 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
