"use client";

import React from "react";
import Link from "next/link";
import { ArrowUp, Mail, Phone, Heart, Sparkles, GraduationCap } from "lucide-react";
import { PORTFOLIO_DATA } from "./portfolioData";

export default function PortfolioFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="portfolio-footer py-12 border-t border-slate-800 bg-slate-950/80 text-slate-400 text-xs relative">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
          {/* Identity */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="font-extrabold text-base text-slate-100 tracking-tight flex items-center gap-2 whitespace-nowrap">
              <span>{PORTFOLIO_DATA.profile.name}</span>
            </div>
            <div className="text-emerald-400 font-medium text-xs mt-0.5">
              {PORTFOLIO_DATA.profile.title}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 break-words">
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span>{PORTFOLIO_DATA.profile.education.institution} ({PORTFOLIO_DATA.profile.education.period})</span>
            </div>
          </div>

          {/* Direct Verified Contact Details */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-xs text-slate-300 font-mono">
            <a
              href={`mailto:${PORTFOLIO_DATA.profile.email}`}
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors whitespace-nowrap text-[11px] sm:text-xs"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">{PORTFOLIO_DATA.profile.email}</span>
            </a>
            <a
              href={`tel:${PORTFOLIO_DATA.profile.mobile}`}
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors whitespace-nowrap text-[11px] sm:text-xs"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>+91 {PORTFOLIO_DATA.profile.mobile}</span>
            </a>
          </div>

          {/* Back to top */}
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowUp className="w-4 h-4" />
            <span className="hidden sm:inline">Top</span>
          </button>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} {PORTFOLIO_DATA.profile.name}. All verified projects &amp; architecture case studies.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with Next.js 16, React 19, TypeScript &amp; Python FastAPI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
