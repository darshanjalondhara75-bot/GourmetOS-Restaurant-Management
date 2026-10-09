"use client";

import React, { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  Sparkles,
  Mail,
  Phone,
  GraduationCap,
  Layers,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { PORTFOLIO_DATA } from "./portfolioData";

export default function ResumeSection() {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    const resumeCard = document.getElementById('printable-resume-document');
    if (!resumeCard) {
      window.print();
      return;
    }

    // Clone the resume card HTML
    const resumeHtml = resumeCard.outerHTML;

    // Open a new isolated print window with ONLY the resume content
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Resume — ${PORTFOLIO_DATA.profile.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.45;
    }
    body {
      padding: 16px 20px;
    }

    /* Container resets */
    #printable-resume-document,
    .resume-print-card,
    [class*="bg-slate"],
    [class*="backdrop"] {
      background: #ffffff !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    /* Candidate Header */
    h1 {
      font-size: 21pt !important;
      font-weight: 900 !important;
      color: #0f172a !important;
      margin: 0 0 2pt 0 !important;
      letter-spacing: -0.5px !important;
      text-transform: uppercase !important;
      line-height: 1.15 !important;
    }
    .text-lg.font-bold, .text-lg {
      font-size: 10.5pt !important;
      font-weight: 700 !important;
      color: #047857 !important;
      margin: 2pt 0 0 0 !important;
    }

    /* Header 2-column layout: Name on left, Contact on right */
    .resume-header-row {
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-start !important;
      justify-content: space-between !important;
      gap: 16px !important;
    }
    .resume-contact-block {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-end !important;
      text-align: right !important;
      gap: 4px !important;
      margin-top: 4px !important;
    }
    .resume-contact-item {
      display: inline-flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: flex-end !important;
      gap: 6px !important;
    }
    .resume-contact-item a {
      color: #047857 !important;
      font-family: 'SFMono-Regular', Consolas, Menlo, monospace !important;
      font-size: 8.5pt !important;
      text-decoration: none !important;
    }
    .resume-contact-item svg {
      width: 14px !important;
      height: 14px !important;
      min-width: 14px !important;
      min-height: 14px !important;
      color: #047857 !important;
      stroke: #047857 !important;
      fill: none !important;
      flex-shrink: 0 !important;
      margin: 0 !important;
      vertical-align: middle !important;
    }

    /* Professional Summary */
    p.leading-relaxed, .mt-5 {
      font-size: 8.8pt !important;
      color: #334155 !important;
      line-height: 1.5 !important;
      margin: 8pt 0 0 0 !important;
    }

    /* Section Headings: Icon + Text side-by-side with 8px gap on left */
    .resume-section-title, h2 {
      font-size: 9.5pt !important;
      font-weight: 800 !important;
      color: #047857 !important;
      text-transform: uppercase !important;
      letter-spacing: 1.2px !important;
      border-bottom: 1.5pt solid #cbd5e1 !important;
      padding-bottom: 3pt !important;
      margin: 12pt 0 6pt 0 !important;
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: flex-start !important;
      gap: 8px !important;
    }
    .resume-section-title svg, h2 svg {
      width: 14px !important;
      height: 14px !important;
      min-width: 14px !important;
      min-height: 14px !important;
      color: #047857 !important;
      stroke: #047857 !important;
      fill: none !important;
      stroke-width: 2.2 !important;
      flex-shrink: 0 !important;
      display: inline-block !important;
      vertical-align: middle !important;
      margin: 0 !important;
    }
    .resume-section-title span, h2 span {
      display: inline-block !important;
      vertical-align: middle !important;
    }

    /* Education Block: Institution on left, Dates on right */
    .resume-edu-row {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-top: 2pt !important;
    }
    .resume-edu-row .font-bold {
      font-size: 9.5pt !important;
      font-weight: 700 !important;
      color: #0f172a !important;
    }
    .resume-edu-row .font-mono {
      font-size: 8.5pt !important;
      font-weight: 600 !important;
      color: #047857 !important;
    }

    /* Technical Skills: 2-column balanced grid */
    .resume-skills-grid {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 10pt 16pt !important;
      margin-top: 3pt !important;
    }
    .resume-skills-grid .block {
      display: block !important;
      margin-bottom: 2pt !important;
      color: #0f172a !important;
      font-weight: 700 !important;
      font-size: 8.8pt !important;
    }
    .resume-skills-grid .text-slate-300 {
      color: #334155 !important;
      font-size: 8.5pt !important;
      line-height: 1.45 !important;
    }

    /* Primary Project & Experience */
    .resume-project-header {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-bottom: 2pt !important;
    }
    .resume-project-header h3 {
      font-size: 10.5pt !important;
      font-weight: 800 !important;
      color: #0f172a !important;
      margin: 0 !important;
    }
    .resume-project-header span {
      font-size: 8.5pt !important;
      font-family: monospace !important;
      color: #047857 !important;
      font-weight: 600 !important;
    }
    .text-slate-400.mb-4 {
      font-size: 8.2pt !important;
      color: #64748b !important;
      margin: 2pt 0 7pt 0 !important;
    }

    /* Project Bullets: CheckCircle2 aligned with top line of text */
    .space-y-3 {
      display: flex !important;
      flex-direction: column !important;
      gap: 6pt !important;
    }
    .resume-bullet-item {
      display: flex !important;
      flex-direction: row !important;
      align-items: flex-start !important;
      gap: 9px !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .resume-bullet-item svg {
      width: 14px !important;
      height: 14px !important;
      min-width: 14px !important;
      min-height: 14px !important;
      margin-top: 2.5px !important;
      color: #047857 !important;
      stroke: #047857 !important;
      fill: none !important;
      stroke-width: 2.2 !important;
      flex-shrink: 0 !important;
      display: block !important;
    }
    .resume-bullet-item > div {
      flex: 1 !important;
      line-height: 1.42 !important;
      font-size: 8.6pt !important;
      color: #334155 !important;
    }
    .resume-bullet-item strong {
      color: #0f172a !important;
      font-weight: 700 !important;
    }

    /* Borders */
    .pb-8 { padding-bottom: 9pt !important; }
    .mb-8 { margin-bottom: 9pt !important; }
    .border-b { border-bottom: 1px solid #e2e8f0 !important; }

    /* Hide buttons and screen-only elements */
    button, .no-print {
      display: none !important;
    }

    @media print {
      body {
        padding: 0 !important;
      }
      button {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  ${resumeHtml}
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  <\/script>
</body>
</html>`);
    printWindow.document.close();
  };


  const handleDownloadTextResume = () => {
    const textContent = `===============================================================
DARSHAN JALONDHARA
Python Backend & Next.js Frontend Developer
===============================================================

CONTACT INFORMATION:
- Email: ${PORTFOLIO_DATA.profile.email}
- Phone: ${PORTFOLIO_DATA.profile.mobile}

PROFESSIONAL SUMMARY:
${PORTFOLIO_DATA.profile.tagline}
Full-stack software developer specializing in Python backend systems (FastAPI, MongoDB Motor, PyJWT) and Next.js frontend interfaces (React 19, TypeScript, App Router). Architected and engineered GourmetOS, a full-stack, 4-panel restaurant management and ordering system featuring real-time Server-Sent Events (SSE), atomic dining session tokens, and a two-tier inventory auditing workflow.

EDUCATION:
- Institution: ${PORTFOLIO_DATA.profile.education.institution}
- Period: ${PORTFOLIO_DATA.profile.education.period}

CORE TECHNICAL SKILLS:
- Backend: Python 3, FastAPI, Pydantic v2, PyJWT, Server-Sent Events (SSE), Razorpay SDK
- Frontend: Next.js 16, React 19, TypeScript 5, Tailwind CSS, Lucide React
- Database: MongoDB, Motor Async Driver, Aggregation Pipelines
- Architecture: Role-Based Access Control (RBAC), Atomic Session Tokenization, Real-Time Event Sync

PRIMARY PROJECT:
Restaurant Management & Ordering System (GourmetOS)
Full-Stack Real-Time Restaurant Management & Touchless Dining Platform

PROJECT EXPERIENCE & MODULES:
1. Admin Command Center:
   - Live revenue, active tables, order counters, staff shift roster, and daily reports.
   - Centralized two-tier inventory audit verification and requisition approval.
2. Chef Kitchen Display System (KDS):
   - Status-driven order ticket progression (Pending -> Accepted -> Cooking -> Ready).
   - Preparation elapsed timers, order cancellation logging, and ingredient usage records.
3. Cashier POS & Billing Terminal:
   - Color-coded dining floor table occupancy grid (Available, Occupied, Reserved, Cleaning).
   - Unpaid bill itemization, multi-currency (USD/INR) payment settlement, and thermal/web receipts.
4. User & Customer Touchless Dining:
   - Table reservation system with party size selection and arrival time scheduling.
   - QR-code touchless ordering with atomic single-use session tokens to eliminate duplicate orders.
   - Categorized digital menu with Veg/Non-Veg badges and dynamic shopping cart.
5. Inventory & Stock Auditing System:
   - Raw ingredient tracking with minimum thresholds and procurement invoices.
   - Two-tier audit workflow connecting chef physical count entry with admin variance reconciliation.
6. Responsive UI & Dual Theme System:
   - 100% fluid layouts across 320px mobile to 1440px desktop screens with zero horizontal overflow.
   - Custom CSS design tokens for emerald light and dark liquid-glass themes with WCAG contrast compliance.
===============================================================`;

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Darshan_Jalondhara_Resume.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtmlResume = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${PORTFOLIO_DATA.profile.name} - Resume</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 25px; line-height: 1.5; font-size: 13px; background: #fff; }
    h1 { font-size: 26px; font-weight: 900; margin: 0 0 4px 0; text-transform: uppercase; color: #0f172a; }
    .title { font-size: 15px; font-weight: 700; color: #059669; margin-bottom: 12px; }
    .contact { font-family: monospace; font-size: 12px; color: #475569; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #059669; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px; margin: 18px 0 10px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    ul { margin: 6px 0 0 18px; padding: 0; }
    li { margin-bottom: 6px; }
    .badge { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block; }
  </style>
</head>
<body>
  <h1>${PORTFOLIO_DATA.profile.name}</h1>
  <div class="title">${PORTFOLIO_DATA.profile.title}</div>
  <div class="contact">
    Email: ${PORTFOLIO_DATA.profile.email} &bull; Phone: +91 ${PORTFOLIO_DATA.profile.mobile} &bull; Education: ${PORTFOLIO_DATA.profile.education.institution} (${PORTFOLIO_DATA.profile.education.period})
  </div>
  <p>${PORTFOLIO_DATA.profile.overview}</p>

  <div class="section-title">Education & Academic Background</div>
  <p><strong>${PORTFOLIO_DATA.profile.education.institution}</strong> — <span class="badge">Active Student / In Progress</span> (${PORTFOLIO_DATA.profile.education.period})</p>

  <div class="section-title">Technical Competencies</div>
  <div class="grid">
    <div><strong>Backend Development:</strong> Python 3, FastAPI, Pydantic v2, PyJWT, Server-Sent Events (SSE), Razorpay SDK</div>
    <div><strong>Frontend Development:</strong> Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS, Lucide React</div>
    <div><strong>Database & Storage:</strong> MongoDB, Motor Async Driver, Aggregation Pipelines</div>
    <div><strong>Architecture & UX:</strong> Role-Based Access Control, Atomic Session Tokens, Dual-Theme Tokens</div>
  </div>

  <div class="section-title">Primary Project: Restaurant Management & Ordering System (GourmetOS)</div>
  <p><em>Full-Stack Real-Time Production Platform (Python FastAPI Backend + Next.js 16 Frontend + MongoDB Motor)</em></p>
  <ul>
    <li><strong>Four Segregated Panels:</strong> Admin Command, Chef Line (KDS), Cashier POS, and Customer Dining.</li>
    <li><strong>Touchless Dining & QR Session Engine:</strong> Atomic single-use tokens to eliminate duplicate orders.</li>
    <li><strong>Real-Time Event Dispatching via SSE:</strong> Instant status updates across kitchen and dining terminals.</li>
    <li><strong>Two-Tier Inventory Auditing:</strong> Raw ingredient usage logs with physical counts & admin approvals.</li>
    <li><strong>Emerald Liquid-Glass UI:</strong> Fully responsive 320px–1440px layout with high-contrast accessibility.</li>
  </ul>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Darshan_Jalondhara_Resume.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(
        `Darshan Jalondhara - Python Backend & Next.js Frontend Developer\nEmail: ${PORTFOLIO_DATA.profile.email}\nPhone: ${PORTFOLIO_DATA.profile.mobile}\nEducation: ${PORTFOLIO_DATA.profile.education.institution} (${PORTFOLIO_DATA.profile.education.period})\nProject: Restaurant Management & Ordering System (Python FastAPI & Next.js 16)`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <section id="resume" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Professional Resume</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            Curriculum Vitae &amp; Technical Resume
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            A comprehensive, transparent resume summarizing my technical capabilities, education, and primary project
            responsibilities.
          </p>
        </div>

        {/* Action Bar (Print / Download / Copy) */}
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-8 no-print">
          <div className="text-xs sm:text-sm text-slate-400 font-mono">
            Format: Standard Executive A4 Layout (Prints Resume Only)
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Print / Save PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all whitespace-nowrap"
              title="Print directly or save as PDF (prints only resume)"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Print / Save PDF</span>
            </button>

            {/* Download HTML Resume Button */}
            <button
              onClick={handleDownloadHtmlResume}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 transition-all whitespace-nowrap"
              title="Download standalone HTML resume"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Download HTML</span>
            </button>

            {/* Download Text Resume Button */}
            <button
              onClick={handleDownloadTextResume}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all whitespace-nowrap"
              title="Download clean text format resume"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download Text (.txt)</span>
            </button>

            {/* Copy Quick Summary */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-all whitespace-nowrap"
              title="Copy quick summary to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span>{copied ? "Copied!" : "Copy Summary"}</span>
            </button>
          </div>
        </div>

        {/* Formatted Resume Sheet (A4 Styled Card) */}
        <div id="printable-resume-document" className="resume-print-card max-w-5xl mx-auto p-8 sm:p-12 rounded-3xl bg-slate-950/90 border border-emerald-500/30 backdrop-blur-xl shadow-2xl text-left">
          {/* Resume Header */}
          <div className="pb-8 border-b border-slate-800 mb-8">
            <div className="resume-header-row flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-100 uppercase tracking-tight">
                  {PORTFOLIO_DATA.profile.name}
                </h1>
                <p className="text-lg font-bold text-emerald-400 mt-1">
                  {PORTFOLIO_DATA.profile.title}
                </p>
              </div>

              <div className="resume-contact-block text-xs sm:text-sm text-slate-300 space-y-1 sm:text-right font-mono">
                <div className="resume-contact-item flex items-center sm:justify-end gap-2">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a href={`mailto:${PORTFOLIO_DATA.profile.email}`} className="hover:text-emerald-300 underline">
                    {PORTFOLIO_DATA.profile.email}
                  </a>
                </div>
                <div className="resume-contact-item flex items-center sm:justify-end gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a href={`tel:${PORTFOLIO_DATA.profile.mobile}`} className="hover:text-emerald-300">
                    +91 {PORTFOLIO_DATA.profile.mobile}
                  </a>
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {PORTFOLIO_DATA.profile.overview}
            </p>
          </div>

          {/* Education Block */}
          <div className="pb-8 border-b border-slate-800 mb-8">
            <h2 className="resume-section-title text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Education</span>
            </h2>
            <div className="resume-edu-row flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm">
              <div className="font-bold text-slate-100">
                {PORTFOLIO_DATA.profile.education.institution}
              </div>
              <div className="font-mono text-emerald-400 mt-1 sm:mt-0 font-medium">
                {PORTFOLIO_DATA.profile.education.period}
              </div>
            </div>
          </div>

          {/* Technical Skills Block */}
          <div className="pb-8 border-b border-slate-800 mb-8">
            <h2 className="resume-section-title text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Technical Skills</span>
            </h2>

            <div className="resume-skills-grid grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="font-semibold text-slate-200 block mb-1">Backend Development:</span>
                <span className="text-slate-300 leading-relaxed">
                  Python 3, FastAPI, Pydantic v2, PyJWT Authentication, Server-Sent Events (SSE), Razorpay SDK.
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-200 block mb-1">Frontend Development:</span>
                <span className="text-slate-300 leading-relaxed">
                  Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS, Lucide React, CSS Design Tokens.
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-200 block mb-1">Database &amp; Storage:</span>
                <span className="text-slate-300 leading-relaxed">
                  MongoDB, Motor Asynchronous Driver, Indexing, Aggregation Pipelines.
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-200 block mb-1">Architecture &amp; UX:</span>
                <span className="text-slate-300 leading-relaxed">
                  Role-Based Access Control (4 Panels), Atomic Session Tokenization, High-Contrast Light &amp; Dark Modes.
                </span>
              </div>
            </div>
          </div>

          {/* Main Project & Experience Block */}
          <div>
            <h2 className="resume-section-title text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Primary Project &amp; Engineering Experience</span>
            </h2>

            <div className="mb-6">
              <div className="resume-project-header flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  Restaurant Management &amp; Ordering System (GourmetOS)
                </h3>
                <span className="text-xs font-mono text-emerald-400">Full-Stack Application</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Python FastAPI Backend • Next.js 16 / React 19 Frontend • MongoDB Motor • Real-time SSE
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                <div className="resume-bullet-item flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100">Four Segregated Role Panels:</strong> Engineered specialized
                    operational workspaces for Administrators (oversight, shift rosters, reports), Chefs (KDS ticket
                    state machine, preparation timers), Cashiers (table floor status, itemized POS billing), and
                    Customers (touchless dining).
                  </div>
                </div>

                <div className="resume-bullet-item flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100">Touchless Dining &amp; QR Session Engine:</strong> Developed table
                    booking lifecycle and atomic single-use session tokens issued upon QR code scanning to guarantee
                    zero duplicate orders per dining cycle.
                  </div>
                </div>

                <div className="resume-bullet-item flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100">Real-Time Event Dispatching via SSE:</strong> Implemented
                    authenticated Server-Sent Events stream updating kitchen ticket stages and customer tracking views
                    in real time without aggressive interval polling.
                  </div>
                </div>

                <div className="resume-bullet-item flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100">Two-Tier Inventory &amp; Stock Auditing:</strong> Built raw
                    ingredient ledger with consumption tracking, physical count submission by chefs, and administrative
                    variance verification before adjusting inventory balances.
                  </div>
                </div>

                <div className="resume-bullet-item flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100">Emerald Liquid-Glass UI &amp; Accessibility:</strong> Designed
                    responsive layouts for 320px–1440px displays, resolving light mode input washout with high-contrast
                    CSS surface tokens and persistent navigation state indicators.
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
