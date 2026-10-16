"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  FileText,
  Mail,
  Phone,
  ExternalLink,
  Code2,
  Server,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  GraduationCap
} from "lucide-react";
import { PORTFOLIO_DATA } from "./portfolioData";

interface HeroSectionProps {
  onOpenResumeModal: () => void;
}

export default function HeroSection({ onOpenResumeModal }: HeroSectionProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="hero"
      className="relative flex items-center justify-center pt-28 pb-16 lg:pt-32 lg:pb-20 overflow-hidden"
    >
      {/* Subtle emerald atmospheric background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Core Identity & Call to Actions (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left min-w-0 w-full">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] sm:text-xs font-semibold tracking-wide mb-5 shadow-sm max-w-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate sm:whitespace-normal">Full-Stack Software Engineering Portfolio</span>
            </div>

            {/* Name - kept full on one line without splitting on mobile */}
            <h1 className="text-[clamp(1.2rem,5.8vw,3.75rem)] font-extrabold tracking-tight text-slate-100 uppercase mb-3 whitespace-nowrap max-w-full">
              <span>{PORTFOLIO_DATA.profile.name}</span>
            </h1>

            {/* Professional Title */}
            <div className="text-sm sm:text-2xl lg:text-3xl font-semibold tracking-normal sm:tracking-tight text-emerald-400 mb-5 leading-snug break-words">
              {PORTFOLIO_DATA.profile.title}
            </div>

            {/* Truthful Introduction */}
            <p className="text-xs sm:text-base lg:text-lg text-slate-300 max-w-2xl leading-relaxed mb-7">
              {PORTFOLIO_DATA.profile.tagline}
            </p>

            {/* Academic Credentials Verified Banner */}
            <div className="flex items-start sm:items-center gap-2.5 p-3 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-900/60 dark:bg-slate-900/80 border border-emerald-500/20 text-xs sm:text-sm text-slate-300 mb-8 w-full max-w-full min-w-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
              <div className="leading-snug break-words min-w-0 w-full">
                <span className="font-semibold text-slate-200">
                  {PORTFOLIO_DATA.profile.education.institution}
                </span>{" "}
                <span className="text-emerald-400 font-mono text-[10px] sm:text-xs whitespace-nowrap">
                  ({PORTFOLIO_DATA.profile.education.period})
                </span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 w-full sm:w-auto mb-10">
              {/* View My Work */}
              <button
                onClick={() => scrollToSection("project")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <span>View My Work</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              {/* Download / View Resume */}
              <button
                onClick={onOpenResumeModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-emerald-500/30 hover:border-emerald-500/60 shadow-md transition-all hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Download Resume</span>
              </button>

              {/* Contact Me */}
              <button
                onClick={() => scrollToSection("contact")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Me</span>
              </button>
            </div>

            {/* Verified Technical Stack Pill Matrix */}
            <div className="w-full pt-6 border-t border-slate-800/80">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3 block">
                Primary Verified Tech Stack
              </span>
              <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
                {[
                  "Python 3",
                  "FastAPI",
                  "Next.js 16",
                  "React 19",
                  "TypeScript 5",
                  "MongoDB Motor",
                  "Server-Sent Events (SSE)",
                  "Tailwind CSS",
                ].map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-emerald-500/20 text-slate-300 font-medium flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Reference Maker Photo & Project Summary Card (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end min-w-0 w-full">
            <div className="relative w-full max-w-[320px] sm:max-w-md">
              {/* Outer Glow Ring */}
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-emerald-500/30 via-teal-500/20 to-emerald-400/30 rounded-3xl blur-md -z-10" />

              {/* Card Container */}
              <div className="rounded-3xl p-5 sm:p-6 bg-slate-950/80 dark:bg-slate-950/90 border border-emerald-500/30 backdrop-blur-xl shadow-2xl shadow-black/40">
                {/* Photo Container */}
                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden mb-5 border border-emerald-500/20 bg-slate-900 shadow-inner group">
                  <Image
                    src="/images/darshan.jpg"
                    alt="Darshan Jalondhara - Python Backend & Next.js Frontend Developer"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Bottom overlay badge on photo */}
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-emerald-500/30 text-left">
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Darshan Jalondhara</span>
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium">
                      Python Backend &amp; Next.js Frontend Developer
                    </div>
                  </div>
                </div>

                {/* Key Quick Facts */}
                <div className="grid grid-cols-2 gap-2.5 text-left mb-4">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/15">
                    <div className="text-[11px] text-slate-400">Primary Project</div>
                    <div className="text-xs font-bold text-slate-100 mt-0.5">GourmetOS System</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/15">
                    <div className="text-[11px] text-slate-400">Architecture</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">4-Panel RBAC + SSE</div>
                  </div>
                </div>

                {/* Live System Demo Quick Trigger */}
                <Link
                  href="/restaurant"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Explore GourmetOS Live System</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
