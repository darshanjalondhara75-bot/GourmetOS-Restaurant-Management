"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Palette,
  Sun,
  Moon,
  Sparkles,
  Layers,
  CheckCircle2,
  Sliders,
  Type,
  MousePointerClick,
  Square
} from "lucide-react";
import { useTheme } from "@/lib/themeContext";

export default function DesignSystemSection() {
  const { theme, toggleTheme } = useTheme();
  const [activePreview, setActivePreview] = useState<"buttons" | "cards" | "inputs">("buttons");

  const colors = [
    { name: "Primary Emerald", hex: "#10B981", rgb: "16, 185, 129", role: "Primary Accent & Positive Badges" },
    { name: "Deep Forest", hex: "#065F46", rgb: "6, 95, 70", role: "Light Mode Focus & Border Anchors" },
    { name: "Teal Radiance", hex: "#14B8A6", rgb: "20, 184, 166", role: "Glow Gradients & Highlights" },
    { name: "Obsidian Slate", hex: "#0B1220", rgb: "11, 18, 32", role: "Dark Mode Root Background" },
    { name: "Pure Canvas", hex: "#F5F7FA", rgb: "245, 247, 250", role: "Light Mode Root Background" },
  ];

  return (
    <section id="design-system" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Design Tokens &amp; Visual Identity</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Emerald Liquid-Glass Design System
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            The visual identity behind GourmetOS unites modern glassmorphism with high-contrast accessibility across
            both light and dark modes.
          </p>
        </div>

        {/* Theme Toggle Spotlight Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-emerald-500/25 backdrop-blur-xl shadow-xl mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-mono font-bold uppercase text-emerald-400 block mb-1">
              Active Experience Theme: {theme.toUpperCase()}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-100">
              Interactive Light &amp; Dark Theme Testing
            </h3>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Switch themes now to see how CSS design tokens adapt dynamically without causing unreadable text or
              faded form borders.
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 shadow-lg shadow-emerald-500/10 transition-all hover:scale-105"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="text-sm font-bold">
              Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </span>
          </button>
        </div>

        {/* Design System Elements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Color Palette (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/70 border border-emerald-500/20">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              <span>Core Palette &amp; CSS Tokens</span>
            </h3>

            <div className="space-y-3">
              {colors.map((c) => (
                <div
                  key={c.name}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm border border-white/10 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.hex}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 text-right max-w-[130px] font-medium">
                    {c.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive UI Components Gallery (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/70 border border-emerald-500/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 mb-6">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified Design Tokens &amp; Components</span>
              </h3>

              {/* Sub-tabs */}
              <div className="flex items-center justify-start sm:justify-end gap-1.5 text-xs shrink-0">
                {(["buttons", "cards", "inputs"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePreview(tab)}
                    className={`px-3 py-1 rounded-lg capitalize font-medium whitespace-nowrap transition-all ${
                      activePreview === tab
                        ? "bg-emerald-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons Preview */}
            {activePreview === "buttons" && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 mb-2">Button styles with hover &amp; focus indicators:</div>
                <div className="flex flex-wrap gap-3">
                  <button className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30">
                    Primary Emerald Button
                  </button>
                  <button className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-950 border border-emerald-500/40 text-emerald-300">
                    Glass Secondary Action
                  </button>
                  <button className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Subtle Badge Pill
                  </button>
                </div>
              </div>
            )}

            {/* Cards Preview */}
            {activePreview === "cards" && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 mb-2">Liquid-glass card containers with luminescence:</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/20 shadow-md">
                    <span className="text-[10px] font-mono text-emerald-400">KPI Container</span>
                    <div className="text-lg font-bold text-slate-100 mt-1">100% SSE Sync</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Real-time event stream</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/20 shadow-md">
                    <span className="text-[10px] font-mono text-teal-400">Table State</span>
                    <div className="text-lg font-bold text-emerald-400 mt-1">Available (T-4)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Capacity: 4 Guests</div>
                  </div>
                </div>
              </div>
            )}

            {/* Inputs Preview */}
            {activePreview === "inputs" && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 mb-2">
                  High-contrast inputs solving light mode text washout:
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Customer Dining Name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Darshan Jalondhara"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/30 text-slate-100 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Table Party Size
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="4 Guests (Reserved)"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/30 text-slate-100 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
