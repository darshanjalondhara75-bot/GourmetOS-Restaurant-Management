"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  Sparkles,
  Layers,
  Users,
  CheckCircle2,
  Server,
  Images,
} from "lucide-react";
import { PROJECT_GALLERY, GalleryImage } from "./portfolioData";

const CATEGORY_TABS: { id: GalleryImage["category"] | "all"; label: string }[] = [
  { id: "all", label: "All Captures" },
  { id: "admin", label: "Admin Panel" },
  { id: "chef", label: "Chef Kitchen" },
  { id: "cashier", label: "Cashier POS" },
  { id: "booking", label: "Booking & QR" },
  { id: "auth", label: "Security & Auth" },
  { id: "mobile", label: "Mobile" },
  { id: "tablet", label: "Tablet" },
];

const CATEGORY_LABELS: Record<GalleryImage["category"], string> = {
  admin: "Admin Panel",
  chef: "Chef Kitchen",
  cashier: "Cashier POS",
  customer: "Customer Dining",
  booking: "Booking & QR",
  auth: "Security & Auth",
  mobile: "Mobile",
  tablet: "Tablet",
};

export default function FeaturedProjectSection() {
  const [activeCategory, setActiveCategory] = useState<GalleryImage["category"] | "all">("all");
  const [selectedId, setSelectedId] = useState<string>(PROJECT_GALLERY[0].id);

  const filtered = useMemo(
    () =>
      activeCategory === "all"
        ? PROJECT_GALLERY
        : PROJECT_GALLERY.filter((g) => g.category === activeCategory),
    [activeCategory]
  );

  const selected =
    PROJECT_GALLERY.find((g) => g.id === selectedId) || PROJECT_GALLERY[0];

  const handleCategoryChange = (category: GalleryImage["category"] | "all") => {
    setActiveCategory(category);
    const first =
      category === "all"
        ? PROJECT_GALLERY[0]
        : PROJECT_GALLERY.find((g) => g.category === category);
    if (first) setSelectedId(first.id);
  };

  return (
    <section id="project" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level 3: Primary Development Project</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100">
            Restaurant Management &amp; Ordering System
          </h2>
          <p className="mt-2 text-sm sm:text-lg sm:text-xl font-medium text-emerald-400 font-mono break-words leading-relaxed max-w-full">
            GourmetOS — Full-Stack Real-Time Production Platform
          </p>
          <p className="mt-4 text-xs sm:text-base lg:text-lg text-slate-300 leading-relaxed">
            An enterprise-grade, multi-terminal restaurant operations platform engineered with Python FastAPI on the
            backend and Next.js 16 (React 19) on the frontend.
          </p>
        </div>

        {/* Project Meta Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Project Overview */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Project Overview</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Designed to eliminate fragmented operational silos by unifying touchless table reservations, QR-code
              guest ordering, live kitchen ticket queuing, cashier POS billing, and raw inventory audits into one
              real-time system.
            </p>
          </div>

          {/* Card 2: Core Architecture */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Technical Architecture</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Asynchronous Python FastAPI engine backed by MongoDB Motor, streaming state updates over Server-Sent
              Events (SSE). The Next.js 16 frontend leverages React 19, TypeScript, and custom CSS design tokens for
              high-contrast emerald liquid-glass styling.
            </p>
          </div>

          {/* Card 3: The 4 User Roles */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Four User Personas</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tailored operational workspaces for <strong className="text-slate-100">Administrators</strong> (analytics
              &amp; audit approval), <strong className="text-slate-100">Chefs</strong> (KDS tickets &amp; ingredient logs),{" "}
              <strong className="text-slate-100">Cashiers</strong> (table floor &amp; POS billing), and{" "}
              <strong className="text-slate-100">Customers</strong> (touchless ordering).
            </p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = activeCategory === tab.id;
            const count =
              tab.id === "all"
                ? PROJECT_GALLERY.length
                : PROJECT_GALLERY.filter((g) => g.category === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => handleCategoryChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-[11px] sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                    : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isSelected ? "bg-slate-950/20 text-slate-950" : "bg-slate-950/60 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive Screenshot Showcase Viewer */}
        <div className="rounded-3xl p-4 sm:p-8 bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl shadow-2xl mb-8">
          {/* Active Screenshot Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Screenshot Frame (7 cols) */}
            <div className="lg:col-span-7 flex justify-center">
              <div
                key={selected.id}
                className={`relative w-full ${
                  selected.width < selected.height ? "max-w-[340px]" : "max-w-full"
                } portfolio-capture-slide max-h-[min(70dvh,680px)] rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-950 shadow-xl`}
                style={{ aspectRatio: `${selected.width} / ${selected.height}` }}
              >
                <Image
                  src={selected.image}
                  alt={selected.title}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-contain"
                />
              </div>
            </div>

            {/* Screenshot Insights (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs uppercase font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 inline-block">
                    {CATEGORY_LABELS[selected.category]}
                  </span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800 inline-block">
                    {selected.viewport}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mb-3">
                  {selected.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {selected.caption}
                </p>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  {selected.detail}
                </p>

                <div className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Real production screenshot extracted from active project</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Fully responsive layout supporting mobile and desktop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Connected to live backend APIs &amp; MongoDB storage</span>
                  </div>
                </div>
              </div>

              {/* Action button to launch app */}
              <Link
                href="/restaurant"
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/30 transition-all text-center"
              >
                <span>Launch Live System Demo</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Categorized Thumbnail Gallery */}
        <div className="rounded-3xl p-4 sm:p-8 bg-slate-900/60 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Images className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                {activeCategory === "all"
                  ? "All Verified Captures"
                  : `${CATEGORY_LABELS[activeCategory as GalleryImage["category"]]} Captures`}
              </span>
            </h3>
            <span className="text-xs font-mono text-slate-400 shrink-0">
              {filtered.length} {filtered.length === 1 ? "capture" : "captures"} · click to inspect
            </span>
          </div>

          <div className="portfolio-gallery-columns columns-1 min-[480px]:columns-2 xl:columns-3 2xl:columns-4 gap-4">
            {filtered.map((g) => {
              const isSelected = g.id === selectedId;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedId(g.id)}
                  className={`portfolio-gallery-card mb-4 w-full break-inside-avoid text-left rounded-2xl overflow-hidden border transition-all duration-200 group ${
                    isSelected
                      ? "border-emerald-400 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/50"
                      : "border-slate-800 hover:border-emerald-500/40"
                  }`}
                >
                  <div
                    className="relative w-full bg-slate-950 overflow-hidden"
                    style={{
                      aspectRatio: `${g.width} / ${g.height}`,
                      maxHeight: g.width < g.height ? "20rem" : undefined,
                    }}
                  >
                    <Image
                      src={g.image}
                      alt={g.title}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-contain"
                    />
                    <span className="absolute top-2 left-2 text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950/85 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                      {CATEGORY_LABELS[g.category]}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/80">
                    <div className="text-xs font-bold text-slate-100 leading-tight mb-1 line-clamp-2">
                      {g.title}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                      {g.caption}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
