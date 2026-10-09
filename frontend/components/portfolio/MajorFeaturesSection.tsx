"use client";

import React, { useState } from "react";
import {
  Lock,
  Shield,
  Calendar,
  QrCode,
  Utensils,
  ShoppingCart,
  Activity,
  ChefHat,
  CreditCard,
  Receipt,
  Package,
  FileCheck,
  TrendingUp,
  FileSpreadsheet,
  Smartphone,
  SunMoon,
  Sparkles,
  CheckCircle2,
  Search
} from "lucide-react";
import { PORTFOLIO_DATA } from "./portfolioData";

export default function MajorFeaturesSection() {
  const [searchQuery, setSearchQuery] = useState("");

  const featureIcons: Record<string, any> = {
    "PyJWT Authentication & Security": Lock,
    "Granular Role-Based Access Control": Shield,
    "Touchless Table Booking & Reservation": Calendar,
    "QR-Code Dining Session Tokenization": QrCode,
    "Digital Menu Catalog & Dietary Tags": Utensils,
    "Dynamic Shopping Cart & Custom Notes": ShoppingCart,
    "Real-Time Order Lifecycle Tracking": Activity,
    "Kitchen Display System (KDS)": ChefHat,
    "Cashier POS & Multi-Method Billing": CreditCard,
    "Printable Thermal & Web Receipts": Receipt,
    "Ingredient Inventory & Stock Tracking": Package,
    "Two-Tier Stock Auditing & Admin Approval": FileCheck,
    "Usage & Purchase Procurement Logs": TrendingUp,
    "Staff Shift Roster & Daily Scheduling": FileSpreadsheet,
    "Server-Sent Events (SSE) Synchronization": Sparkles,
    "Dual Emerald Liquid-Glass Theme System": SunMoon,
  };

  const filteredFeatures = PORTFOLIO_DATA.features.filter(
    (feat) =>
      feat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="features" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level 6: Verified Feature Matrix</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Engineered Capabilities &amp; System Modules
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            16 distinct functional modules developed to handle real-world restaurant workloads with resilience and
            predictability.
          </p>
        </div>

        {/* Feature Search Filter */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features (e.g. JWT, QR, POS, Audit)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/25 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredFeatures.map((feat, idx) => {
            const Icon = featureIcons[feat.title] || CheckCircle2;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900/90 border border-emerald-500/15 hover:border-emerald-500/40 transition-all duration-300 group flex flex-col justify-between hover:-translate-y-1 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-100 mb-2 group-hover:text-emerald-400 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Implemented</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">Verified</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
