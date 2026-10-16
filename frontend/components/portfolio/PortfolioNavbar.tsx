"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sun,
  Moon,
  Menu,
  X,
  FileText,
  ExternalLink,
  User,
  Sparkles,
  Rocket,
  Network,
  LayoutGrid,
  Zap,
  FileSearch,
  GraduationCap,
  Mail,
} from "lucide-react";
import { useTheme } from "@/lib/themeContext";
import { PORTFOLIO_DATA } from "./portfolioData";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "About", href: "#about", icon: User },
  { label: "Skills", href: "#skills", icon: Sparkles },
  { label: "Project", href: "#project", icon: Rocket },
  { label: "Architecture", href: "#architecture", icon: Network },
  { label: "Panels", href: "#panels", icon: LayoutGrid },
  { label: "Features", href: "#features", icon: Zap },
  { label: "Case Study", href: "#case-study", icon: FileSearch },
  { label: "Education", href: "#education", icon: GraduationCap },
  { label: "Resume", href: "#resume", icon: FileText },
  { label: "Contact", href: "#contact", icon: Mail },
];

export default function PortfolioNavbar({ onOpenResumeModal }: { onOpenResumeModal?: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      // Section intersection detection
      const sections = ["hero", "about", "skills", "project", "architecture", "panels", "features", "case-study", "responsive", "design-system", "journey", "education", "resume", "contact"];
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  // Lock body scroll while the mobile menu is open (same as the landing page)
  useEffect(() => {
    const root = document.documentElement;
    if (mobileMenuOpen) {
      root.classList.add("scroll-lock");
    } else {
      root.classList.remove("scroll-lock");
    }
    return () => {
      root.classList.remove("scroll-lock");
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", href);
      setActiveSection(targetId);
    }
  };

  return (
    <>
    <header
      className={`portfolio-nav fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/85 dark:bg-slate-950/90 backdrop-blur-md border-b border-emerald-500/20 shadow-lg shadow-black/20"
          : "bg-slate-950/40 backdrop-blur-sm border-b border-emerald-500/10"
      }`}
    >
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Brand / Name */}
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, "#hero")}
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1 shrink-0 whitespace-nowrap"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-base shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform shrink-0">
            DJ
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-pulse" />
          </div>
          <div className="shrink-0">
            <div className="font-bold text-slate-100 text-sm tracking-tight whitespace-nowrap">
              {PORTFOLIO_DATA.profile.name}
            </div>
            <div className="text-[10px] sm:text-[11px] font-medium text-emerald-400 tracking-wide whitespace-nowrap">
              Python &amp; Next.js
            </div>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-0.5 2xl:gap-1.5 bg-slate-900/60 dark:bg-slate-900/80 p-1 2xl:p-1.5 rounded-full border border-emerald-500/20 backdrop-blur-md text-xs font-medium shrink-0">
          {NAV_ITEMS.map((item) => {
            const id = item.href.replace("#", "");
            const isActive = activeSection === id;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`px-2.5 2xl:px-3 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap shrink-0 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/50"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden xl:flex items-center gap-2 2xl:gap-3 shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle light or dark theme"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Quick Resume Button */}
          <a
            href="#resume"
            onClick={(e) => {
              if (onOpenResumeModal) {
                e.preventDefault();
                onOpenResumeModal();
              } else {
                handleNavClick(e, "#resume");
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Resume</span>
          </a>

          {/* Launch App Demo Link */}
          <Link
            href="/restaurant"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 transition-all whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            title="Launch GourmetOS Restaurant Application"
          >
            <span className="whitespace-nowrap">Live System Demo</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>

        {/* Mobile Actions & Menu Button */}
        <div className="flex items-center gap-2 xl:hidden">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg bg-slate-900/80 border border-emerald-500/20 text-emerald-400"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="portfolio-mobile-drawer"
            className="p-2 rounded-lg bg-slate-900/80 border border-emerald-500/20 text-slate-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Drawer Navigation — same right slide-in pattern as the landing page */}
    {mobileMenuOpen && (
      <div
        id="portfolio-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed inset-0 z-[90] xl:hidden"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Sliding Menu Panel */}
        <div className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-[#0c1424] shadow-2xl flex flex-col animate-slideInRight overflow-hidden">
          {/* Menu Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-emerald-600/25">
                DJ
              </div>
              <span className="font-bold text-slate-900 dark:text-white">
                Menu
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              title="Close Menu (Esc)"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-3">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const id = item.href.replace("#", "");
                    const isActive = activeSection === id;
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-500 border-l-4 border-emerald-500"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-emerald-500" : "text-emerald-500"}`} />
                        {item.label}
                      </a>
                    );
                  })}
            </nav>

            {/* Divider */}
            <div className="my-4 border-t border-slate-200 dark:border-slate-800" />

            {/* Quick Actions */}
            <div className="space-y-2 px-3">
              <a
                href="#resume"
                onClick={(e) => {
                  if (onOpenResumeModal) {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    onOpenResumeModal();
                  } else {
                    handleNavClick(e, "#resume");
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-500" />
                View &amp; Download Resume
              </a>
              <Link
                href="/restaurant"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Explore Live Restaurant System
              </Link>
            </div>
          </div>

          {/* Menu Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 text-center">
              {PORTFOLIO_DATA.profile.name} — Portfolio
            </p>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
