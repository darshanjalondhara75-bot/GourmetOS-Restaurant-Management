"use client";

import React, { useState } from "react";
import {
  Mail,
  Phone,
  Copy,
  Check,
  Send,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { PORTFOLIO_DATA } from "./portfolioData";

export default function ContactSection() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO_DATA.profile.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // fallback
    }
  };

  const copyMobile = async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO_DATA.profile.mobile);
      setCopiedMobile(true);
      setTimeout(() => setCopiedMobile(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level 10: Direct Contact</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Get in Touch
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            I am currently open to software engineering opportunities, technical discussions, and full-stack development roles.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Email Card */}
          <div className="p-5 sm:p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/25 backdrop-blur-xl shadow-xl flex flex-col justify-between min-w-0">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Mail className="w-6 h-6" />
              </div>

              <span className="text-xs uppercase font-mono font-bold text-slate-400">Email Address</span>
              <div className="text-xs sm:text-base font-mono font-bold text-slate-100 mt-1 whitespace-nowrap overflow-x-auto select-all max-w-full">
                {PORTFOLIO_DATA.profile.email}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Direct inbox for employment inquiries, interviews, and project discussions.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
              <a
                href={`mailto:${PORTFOLIO_DATA.profile.email}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all text-center whitespace-nowrap"
              >
                <Send className="w-4 h-4 shrink-0" />
                <span>Email Me</span>
              </a>

              <button
                onClick={copyEmail}
                className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-300 hover:bg-slate-800 transition-colors shrink-0"
                title="Copy email to clipboard"
                aria-label="Copy email address"
              >
                {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Phone / Mobile Card */}
          <div className="p-5 sm:p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/25 backdrop-blur-xl shadow-xl flex flex-col justify-between min-w-0">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Phone className="w-6 h-6" />
              </div>

              <span className="text-xs uppercase font-mono font-bold text-slate-400">Mobile Contact</span>
              <div className="text-base sm:text-lg font-bold text-slate-100 mt-1 font-mono whitespace-nowrap">
                +91 {PORTFOLIO_DATA.profile.mobile}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Available for phone interviews, urgent recruiter calls, and WhatsApp discussions.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
              <a
                href={`tel:${PORTFOLIO_DATA.profile.mobile}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/30 transition-all text-center"
              >
                <Phone className="w-4 h-4" />
                <span>Call Me</span>
              </a>

              <button
                onClick={copyMobile}
                className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-300 hover:bg-slate-800 transition-colors"
                title="Copy phone number to clipboard"
                aria-label="Copy phone number"
              >
                {copiedMobile ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Verification Guarantee Banner */}
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Verified direct contact channels of Darshan Jalondhara. No intermediaries or fake profiles.</span>
        </div>
      </div>
    </section>
  );
}
