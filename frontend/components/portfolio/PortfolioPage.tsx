"use client";

import React, { useEffect, useRef, useState } from "react";
import PortfolioNavbar from "./PortfolioNavbar";
import HeroSection from "./HeroSection";
import ProjectMetricsSection from "./ProjectMetricsSection";
import AboutSection from "./AboutSection";
import SkillsSection from "./SkillsSection";
import FeaturedProjectSection from "./FeaturedProjectSection";
import ArchitectureFlowSection from "./ArchitectureFlowSection";
import FourPanelsSection from "./FourPanelsSection";
import MajorFeaturesSection from "./MajorFeaturesSection";
import ProblemsSolvedSection from "./ProblemsSolvedSection";
import ResponsiveLabSection from "./ResponsiveLabSection";
import DesignSystemSection from "./DesignSystemSection";
import DevelopmentJourneySection from "./DevelopmentJourneySection";
import EducationSection from "./EducationSection";
import ResumeSection from "./ResumeSection";
import ContactSection from "./ContactSection";
import PortfolioFooter from "./PortfolioFooter";
import { X, Printer, Download, Mail, Phone, GraduationCap, CheckCircle2 } from "lucide-react";
import { PORTFOLIO_DATA } from "./portfolioData";

export default function PortfolioPage() {
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

  // Landing-page style draw & slide-in animation for every portfolio section.
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const sections = Array.from(main.children) as HTMLElement[];
    sections.forEach((section, index) => {
      section.classList.add("portfolio-draw-section");
      section.style.setProperty("--draw-delay", `${Math.min(index * 70, 420)}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("draw-in-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const handlePrint = () => {
    setResumeModalOpen(false);
    setTimeout(() => {
      const resumeCard = document.getElementById('printable-resume-document');
      if (!resumeCard) {
        window.print();
        return;
      }

      const resumeHtml = resumeCard.outerHTML;
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
    }, 200);
  };


  const handleJumpToResumeSection = () => {
    setResumeModalOpen(false);
    const resumeEl = document.getElementById("resume");
    if (resumeEl) {
      resumeEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="portfolio-page min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200 w-full overflow-x-clip">
      {/* Sticky Navigation */}
      <PortfolioNavbar onOpenResumeModal={() => setResumeModalOpen(true)} />

      {/* Main Content */}
      <main className="relative z-10" ref={mainRef}>
        {/* Level 1: Hero Identity */}
        <HeroSection onOpenResumeModal={() => setResumeModalOpen(true)} />

        {/* Verified Codebase Metrics */}
        <ProjectMetricsSection />

        {/* Level 1 (Cont): About Me & Engineering Philosophy */}
        <AboutSection />

        {/* Level 2: Technical Skills Matrix */}
        <SkillsSection />

        {/* Level 3: Main Project Showcase */}
        <FeaturedProjectSection />

        {/* Level 4: Interactive Architecture & User Flow */}
        <ArchitectureFlowSection />

        {/* Level 5: Four-Panel Experience */}
        <FourPanelsSection />

        {/* Level 6: 16 Major Features */}
        <MajorFeaturesSection />

        {/* Level 7: Problems I Solved (Case Study) */}
        <ProblemsSolvedSection />

        {/* Responsive Design Lab */}
        <ResponsiveLabSection />

        {/* UI / Design System Showcase */}
        <DesignSystemSection />

        {/* Level 8: 12-Step Development Journey */}
        <DevelopmentJourneySection />

        {/* Level 9: Education */}
        <EducationSection />

        {/* Detailed Curriculum Vitae / Resume Section */}
        <ResumeSection />

        {/* Level 10: Direct Contact Channels */}
        <ContactSection />
      </main>

      {/* Footer */}
      <PortfolioFooter />

      {/* Resume Quick-View Modal */}
      {resumeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md no-print">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-100">{PORTFOLIO_DATA.profile.name} — Resume</h3>
                <p className="text-xs text-emerald-400 font-mono">{PORTFOLIO_DATA.profile.title}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>

                <button
                  onClick={() => setResumeModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Compact Executive Summary */}
            <div className="space-y-5 text-xs sm:text-sm text-slate-300">
              {/* Contact */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div>Email: {PORTFOLIO_DATA.profile.email}</div>
                <div>Phone: +91 {PORTFOLIO_DATA.profile.mobile}</div>
                <div>Education: {PORTFOLIO_DATA.profile.education.institution} ({PORTFOLIO_DATA.profile.education.period})</div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  Core Skills
                </h4>
                <p className="text-xs text-slate-300">
                  Python, FastAPI, Next.js 16, React 19, TypeScript, MongoDB Motor, Pydantic, PyJWT, Server-Sent Events, Tailwind CSS.
                </p>
              </div>

              {/* Project */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  Primary Project: GourmetOS Restaurant Management System
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-2">
                  Engineered full-stack real-time restaurant platform supporting 4 segregated roles: Admin Command, Chef Line (KDS), Cashier POS, and Customer Touchless Dining with QR session tokenization.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Real-time Server-Sent Events (SSE) stream for ticket &amp; status updates.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Two-tier inventory audit workflow connecting chef counts &amp; admin approvals.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Cross-device responsive design with emerald liquid-glass light/dark tokens.</span>
                  </li>
                </ul>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={handleJumpToResumeSection}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline"
                >
                  View Full Interactive CV Section &darr;
                </button>
                <button
                  onClick={() => setResumeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
