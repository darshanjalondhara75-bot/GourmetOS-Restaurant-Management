"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Laptop,
  Tablet,
  Smartphone,
  Sparkles,
  CheckCircle2
} from "lucide-react";

type DeviceId = "desktop" | "tablet" | "mobile";

export default function ResponsiveLabSection() {
  const [activeDevice, setActiveDevice] = useState<DeviceId>("mobile");

  const devices: {
    id: DeviceId;
    label: string;
    viewport: string;
    icon: typeof Laptop;
    image: string;
    summary: string;
    points: string[];
  }[] = [
    {
      id: "desktop",
      label: "Desktop & Laptop",
      viewport: "1440px × 900px",
      icon: Laptop,
      image: "/images/dashboard_screen.png",
      summary: "Full command center overview with persistent collapsible sidebar, multi-column metric grids, and panoramic tables.",
      points: [
        "Collapsible sidebar navigation with tooltip support",
        "4-column KPI cards layout with real-time statistics",
        "Side-by-side order streams and kitchen ticket boards",
        "Expanded data tables with inline actions and multi-field filtering",
      ],
    },
    {
      id: "tablet",
      label: "Tablet & iPad",
      viewport: "768px × 1024px",
      icon: Tablet,
      image: "/images/tablet_screen.png",
      summary: "Optimized for mobile floor staff: dual-column adaptive cards, touch-optimized dialogs, and smooth gestural navigation.",
      points: [
        "2-column adaptive card layouts replacing rigid table structures",
        "Compact header bar with collapsible slide-in drawer",
        "Touch-friendly tap targets meeting 44px minimum sizing",
        "Full modal accessibility with contained overscroll scrolling",
      ],
    },
    {
      id: "mobile",
      label: "Mobile Smartphone",
      viewport: "390px × 844px",
      icon: Smartphone,
      image: "/images/mobile_menu_screen.png",
      summary: "One-handed guest and staff experience with zero horizontal overflow, touch bottom drawers, and sticky action buttons.",
      points: [
        "Single-column stacked layout with zero horizontal overflow",
        "Touch-friendly floating cart drawer and action buttons",
        "Native-like sliding drawer for role selection and navigation",
        "Card-based data presentation replacing wide tabular views",
      ],
    },
  ];

  const currentDevice = devices.find((d) => d.id === activeDevice) || devices[0];

  return (
    <section id="responsive" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Responsive Engineering</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Cross-Viewport Responsive Architecture
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            GourmetOS is purposefully engineered to operate smoothly across all device form factors without broken
            dialogs, unreadable typography, or horizontal page drift.
          </p>
        </div>

        {/* Viewport Switcher Controls */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 mb-10"
          role="group"
          aria-label="Choose a device category"
        >
          {devices.map((dev) => {
            const Icon = dev.icon;
            const isSelected = activeDevice === dev.id;
            return (
              <button
                key={dev.id}
                onClick={() => setActiveDevice(dev.id)}
                aria-pressed={isSelected}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                    : "bg-slate-900/80 text-slate-300 hover:text-white border border-emerald-500/20"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{dev.label}</span>
              </button>
            );
          })}
        </div>

        {/* Viewport Demonstration Card */}
        <div className="p-4 sm:p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Device Mockup Frame (7 cols) */}
            <div className="lg:col-span-7 flex justify-center items-center">
              <div
                className={`relative overflow-hidden border border-emerald-500/40 bg-slate-950 shadow-2xl transition-all duration-500 ${
                  activeDevice === "mobile"
                    ? "w-full max-w-[280px] sm:w-[320px] aspect-[9/19] rounded-[2.5rem] border-4 border-slate-800 p-2 bg-slate-900"
                    : activeDevice === "tablet"
                    ? "w-full max-w-[340px] sm:w-[420px] aspect-[3/4] rounded-3xl border-4 border-slate-800 p-2 bg-slate-900"
                    : "w-full aspect-[16/10] rounded-2xl border-4 border-slate-800 p-1 bg-slate-900"
                }`}
              >
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-950">
                  <Image
                    src={currentDevice.image}
                    alt={`${currentDevice.label} screenshot at ${currentDevice.viewport}`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Viewport Details (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    Target Viewport: {currentDevice.viewport}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-slate-100 mb-3">
                  {currentDevice.label} Optimization
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {currentDevice.summary}
                </p>

                <div className="space-y-3 mb-8">
                  {currentDevice.points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Breakpoints Table */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div className="font-semibold text-slate-300 mb-2.5">Tested Screen Breakpoints:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>320px (SE)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>375px (iPhone)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>390px (Pro)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>768px (Tablet)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>1024px (Laptop)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>1440px+ (Desktop)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
