"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  Clock,
  QrCode,
  CheckCircle2,
  ChefHat,
  CreditCard,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Sliders,
  Activity,
  Utensils,
  Eye,
  Zap,
  Radio,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  ChevronDown,
  Flame,
  Award,
  Shield,
  PhoneCall,
  Terminal,
  Laptop,
  Check,
  Search,
  LogIn,
  UserPlus,
  ShieldCheck,
  Receipt,
  Menu,
  X,
  AlertTriangle,
} from "lucide-react";

import { useTheme } from "@/lib/themeContext";
import { BRAND_NAME, BRAND_FULL_NAME, BRAND_TAGLINE } from "@/lib/branding";
import { SnakeCanvas, SnakeConfig } from "./SnakeCanvas";
import { RAZORPAY_TEST_KEY } from "@/lib/razorpay";
import { getCategories, getMenuItems, MenuCategory, MenuItem } from "@/lib/api";

type LandingRole = "chef" | "cashier" | "customer" | "admin";
type PreviewTab = "tables" | "booking" | "kitchen" | "pos" | "inventory" | "sse";
type DemoTicketStatus = "Queued" | "In Progress" | "Ready";

interface LandingRoleDetails {
  title: string;
  description: string;
  capabilities: string[];
}

const LANDING_ROLE_DETAILS: Record<LandingRole, LandingRoleDetails> = {
  chef: {
    title: "Chef Line Display",
    description:
      "Keep the kitchen in sync with incoming orders and give every station a clear view of what needs attention.",
    capabilities: [
      "Review new, active, and completed kitchen tickets by status.",
      "Advance orders through preparation and ready-to-serve stages.",
      "See each ticket’s table assignment, items, and elapsed time.",
      "Maintain menu categories and dish availability.",
      "Track ingredient inventory used by kitchen operations.",
    ],
  },
  cashier: {
    title: "Cashier POS & Billing",
    description:
      "Manage open table bills, record payments, and keep floor availability up to date from one cashier workspace.",
    capabilities: [
      "View table occupancy and customer orders across the restaurant.",
      "Review unpaid bills and their itemized order details.",
      "Collect cash or card payments against an open bill.",
      "Review collected payments and receipt information.",
      "Release tables when bills have been settled.",
    ],
  },
  customer: {
    title: "Customer QR Dining",
    description:
      "Guests can browse dishes and place an order from their table through a session-protected menu.",
    capabilities: [
      "Reserve a table and open its session-protected dining menu.",
      "Browse dish photos, descriptions, categories, and prices.",
      "Search the menu, adjust cart quantities, and submit an order.",
      "Follow order status from kitchen acceptance through completion.",
    ],
  },
  admin: {
    title: "Admin Command Center",
    description:
      "Oversee restaurant operations, staff access, inventory, and service activity from the administration workspace.",
    capabilities: [
      "Monitor restaurant activity and manage table availability.",
      "Review and manage orders across service stages.",
      "Manage inventory levels and menu availability.",
      "Create staff accounts and manage role-based access.",
      "Organize staff shifts and review operational reports.",
    ],
  },
};

export function LandingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Snake physical configuration
  const [snakeConfig, setSnakeConfig] = useState<SnakeConfig>({
    theme: "emerald",
    speed: 3.5,
    segmentCount: 45,
    eyeGlowIntensity: 1.3,
    followCursor: true,
    showFoodOrbs: true,
  });

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [activeRole, setActiveRole] = useState<LandingRole | null>(null);

  // Selected plan for checkout
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [activeSubscribedPlanId, setActiveSubscribedPlanId] = useState<string | null>(null);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Pricing toggle
  const [annualBilling, setAnnualBilling] = useState<boolean>(true);

  // Menu Category Filter for Landing Page section
  const [landingMenuCategory, setLandingMenuCategory] = useState<string>("all");
  const [menuSearch, setMenuSearch] = useState("");
  const [landingMenuCategories, setLandingMenuCategories] = useState<MenuCategory[]>([]);
  const [landingMenuItems, setLandingMenuItems] = useState<MenuItem[]>([]);
  const revealObserverRef = useRef<IntersectionObserver | null>(null);

  // Hero interactive preview tab
  const [previewTab, setPreviewTab] = useState<PreviewTab>("tables");
  const [demoBookingConfirmed, setDemoBookingConfirmed] = useState(false);
  const [demoTableReserved, setDemoTableReserved] = useState(false);
  const [demoTicketStatus, setDemoTicketStatus] = useState<DemoTicketStatus>("Queued");
  const [demoPaymentComplete, setDemoPaymentComplete] = useState(false);
  const [demoStock, setDemoStock] = useState(18);
  const [demoEvent, setDemoEvent] = useState<string | null>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    Promise.all([getCategories(), getMenuItems()]).then(([categories, items]) => {
      setLandingMenuCategories(categories);
      setLandingMenuItems(items);
    }).catch((error: unknown) => {
      console.error("Unable to load the landing-page menu preview:", error);
    });
  }, []);

  // Lock body scroll when mobile menu is open (class-based so it never leaks to other routes)
  useEffect(() => {
    const root = document.documentElement;
    if (mobileMenuOpen || activeRole) {
      root.classList.add("scroll-lock");
    } else {
      root.classList.remove("scroll-lock");
    }
    return () => {
      root.classList.remove("scroll-lock");
    };
  }, [activeRole, mobileMenuOpen]);

  useEffect(() => {
    if (!activeRole) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveRole(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeRole]);

  const plansList: PlanData[] = [
    {
      id: "bistro",
      name: "Bistro Starter",
      priceUSD: annualBilling ? 49 : 65,
      priceINR: annualBilling ? 3999 : 4999,
      period: "month",
      isTrial: false,
      desc: "Ideal for boutique cafes and casual bistros.",
      features: [
        "Up to 15 Real-Time Tables",
        "QR Contactless Dining",
        "Single Chef KDS Station",
        "Basic POS Billing & Receipts",
        "Email Support",
      ],
    },
    {
      id: "grand",
      name: "Grand Fine Dining",
      priceUSD: annualBilling ? 129 : 169,
      priceINR: annualBilling ? 9999 : 12999,
      period: "month",
      isTrial: true,
      desc: "Complete real-time SSE engine for high-volume dining rooms.",
      features: [
        "Unlimited Tables & Floor Zones",
        "Multi-Station Chef Routing",
        "Real-Time SSE Event Broker",
        "Token-Guarded Dining Sessions",
        "Advanced Inventory & Invoicing",
        "24/7 Priority Concierge",
      ],
    },
    {
      id: "enterprise",
      name: "Multi-Chain Enterprise",
      priceUSD: 299,
      priceINR: 24999,
      period: "month",
      isTrial: false,
      desc: "For multi-property hospitality groups and luxury hotel chains.",
      features: [
        "Multi-Branch Centralized Admin",
        "Custom SSE Broker Clusters",
        "ERP & POS Hardware Integrations",
        "Dedicated Account Architect",
        "SLA 99.99% Guaranteed",
      ],
    },
  ];

  const filteredLandingMenu = landingMenuItems.filter((item) => {
    const matchesCategory = landingMenuCategory === "all" ||
      item.category.toLowerCase() === landingMenuCategory.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const landingMenuItemCount = filteredLandingMenu.length;

  useEffect(() => {
    const landingPage = document.querySelector(".landing-page");
    if (!landingPage || !("IntersectionObserver" in window)) return;

    landingPage.classList.add("landing-motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("landing-drawer-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealObserverRef.current = observer;

    landingPage
      .querySelectorAll<HTMLElement>("[data-drawer-reveal]")
      .forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      revealObserverRef.current = null;
      landingPage.classList.remove("landing-motion-ready");
    };
  }, []);

  useEffect(() => {
    document
      .querySelectorAll<HTMLElement>("#dishes-grid > [data-drawer-reveal]")
      .forEach((element) => revealObserverRef.current?.observe(element));
  }, [landingMenuCategory, landingMenuItemCount, menuSearch]);

  return (
    <div className="landing-page relative min-h-screen text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-red-500/30 selection:text-red-200">
      {/* 1. Sinuous Snake Canvas Animation with Glowing Red Snake Eyes */}
      <SnakeCanvas config={snakeConfig} />

      {activeRole && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveRole(null)}
        >
          <section
            aria-labelledby="landing-role-title"
            aria-modal="true"
            className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-8"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="Close role details"
              className="absolute right-4 top-4 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              onClick={() => setActiveRole(null)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
              GourmetOS workspace
            </span>
            <h2
              className="mt-3 pr-8 text-2xl font-extrabold text-slate-900 dark:text-white"
              id="landing-role-title"
            >
              {LANDING_ROLE_DETAILS[activeRole].title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {LANDING_ROLE_DETAILS[activeRole].description}
            </p>

            <ul className="mt-6 space-y-3">
              {LANDING_ROLE_DETAILS[activeRole].capabilities.map((capability) => (
                <li
                  className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200"
                  key={capability}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>

          </section>
        </div>
      )}

      {/* 3. Mobile Menu Overlay with Right Slide Animation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white">Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-3">
                {[
                  { label: "Our Menu", icon: Utensils, href: "#menu-showcase" },
                  { label: "Pillars", icon: Flame, href: "#pillars" },
                  { label: "Workflow", icon: Activity, href: "#workflow" },
                  { label: "Pricing", icon: CreditCard, href: "#pricing" },
                  { label: "FAQ", icon: ChevronDown, href: "#faq" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <Icon className="w-4 h-4 text-emerald-500" />
                      {item.label}
                    </a>
                  );
                })}
              </nav>

              {/* Divider */}
              <div className="my-4 border-t border-slate-200 dark:border-slate-800" />

              {/* Auth Buttons in Menu */}
              <div className="space-y-2 px-3">
                <button
                  onClick={() => router.push("/login")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-amber-500" />
                  Sign In
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Register
                </button>
              </div>
            </div>

            {/* Menu Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 text-center">
                GourmetOS v2.4 Live
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TOP NAVIGATION BAR                                             */}
      {/* ============================================================== */}
      <header className="fixed inset-x-0 top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-[#0b1220]/75 border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3 group">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-700 to-amber-500 text-white shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-all duration-300 sm:h-11 sm:w-11">
              <Utensils className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-extrabold text-base tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  {BRAND_NAME}
                </span>
                <span className="hidden shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 sm:inline">
                  v2.4 Live
                </span>
              </div>
              <p className="hidden truncate text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400 sm:block">
                {BRAND_TAGLINE}
              </p>
            </div>
          </Link>

          {/* Center Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a
              href="#menu-showcase"
              className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            >
              Our Menu
            </a>
            <a
              href="#pillars"
              className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            >
              Pillars
            </a>
            <a
              href="#workflow"
              className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            >
              Workflow
            </a>
            <a
              href="#pricing"
              className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-slate-200 p-2 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer sm:p-2.5"
              aria-label="Toggle Theme"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Sign In Button - Separate */}
            <button
              onClick={() => router.push("/login")}
              type="button"
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-300"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-500" />
              <span>Sign In</span>
            </button>

            {/* Register Button - Separate */}
            <button
              onClick={() => router.push("/register")}
              type="button"
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer lg:hidden sm:p-2.5"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="h-16 sm:h-20" />

      {/* ============================================================== */}
      {/* HERO SECTION                                                   */}
      {/* ============================================================== */}
      <section data-drawer-reveal className="relative pt-10 pb-16 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Subtle Backdrop Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-emerald-500/10 via-amber-500/10 to-red-500/10 blur-3xl pointer-events-none -z-10" />

        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Real-time SSE Live Pill */}
          <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-slate-300/80 bg-slate-900/5 px-4 py-1.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 sm:rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">
              Live SSE Sync Engine Active
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-mono font-semibold text-amber-500">
              0ms Latency Kitchen Dispatch
            </span>
          </div>

          {/* Master Headline */}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] sm:text-6xl lg:text-7xl">
            The Intelligent Operating System for{" "}
            <span className="bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
              Elite Dining
            </span>
          </h1>

          {/* Subtitle description */}
          <p className="text-sm sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Seamlessly synchronize live table slot bookings with Razorpay test protection,
            visual culinary menus, real-time Chef KDS displays, and automated cashier settlements.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#menu-showcase"
              className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-emerald-600 text-white shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5"
            >
              <Utensils className="w-4 h-4" />
              <span>Explore Menu</span>
              <ArrowRight className="w-4 h-4" />
            </a>

          </div>
        </div>

        {/* ============================================================ */}
        {/* HERO INTERACTIVE REAL-TIME LIVE DEMO PREVIEW CONTAINER       */}
        {/* ============================================================ */}
        <div id="workflow" data-drawer-reveal className="mt-14 max-w-5xl mx-auto scroll-mt-24 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl p-4 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex min-w-0 items-center gap-2">
              <div className="hidden h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_#ff003c] sm:block" />
              <div className="hidden h-3 w-3 rounded-full bg-amber-500 sm:block" />
              <div className="hidden h-3 w-3 rounded-full bg-emerald-500 sm:block" />
              <div className="min-w-0 sm:ml-2">
                <span className="block truncate font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                  GourmetOS Interactive Demo
                </span>
                <span className="block text-[10px] text-slate-500">Sample data · no real orders or payments</span>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-950 sm:flex sm:w-auto sm:flex-wrap">
              {[
                { id: "tables", label: "Tables & Occupancy", icon: Calendar },
                { id: "booking", label: "Table Booking", icon: QrCode },
                { id: "kitchen", label: "Chef KDS Queue", icon: ChefHat },
                { id: "pos", label: "Cashier POS", icon: CreditCard },
                { id: "inventory", label: "Inventory", icon: ShieldCheck },
                { id: "sse", label: "Live Event Broker", icon: Radio },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = previewTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    aria-label={tab.label}
                    aria-pressed={isActive}
                    onClick={() => setPreviewTab(tab.id as PreviewTab)}
                    className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold transition-all cursor-pointer sm:px-3 sm:py-1.5 sm:text-xs ${isActive
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {previewTab === "booking" && (
            <div className="animate-fadeIn rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="shrink-0 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-500">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Table T-04 · Garden Suite</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${demoBookingConfirmed ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                        {demoBookingConfirmed ? "Reservation confirmed" : "Available · 7:30 PM"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      Preview a guest booking, table assignment, and the QR dining session that follows.
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      Sample guest: Maya Chen · 2 guests · Today, 7:30 PM
                    </p>
                  </div>
                </div>
                <button
                  aria-pressed={demoBookingConfirmed}
                  className={`w-full shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition sm:w-auto ${demoBookingConfirmed ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200" : "bg-emerald-600 text-white hover:bg-emerald-500"}`}
                  onClick={() => {
                    setDemoBookingConfirmed((confirmed) => {
                      const next = !confirmed;
                      setDemoTableReserved(next);
                      setDemoEvent(next ? "Sample booking confirmed for T-04; guest QR session prepared." : "Sample booking reset for T-04.");
                      return next;
                    });
                  }}
                  type="button"
                >
                  {demoBookingConfirmed ? "Reset booking demo" : "Confirm sample booking"}
                </button>
              </div>
              {demoBookingConfirmed && (
                <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300" role="status">
                  Demo complete: T-04 is reserved and a one-time guest dining session is ready.
                </p>
              )}
            </div>
          )}

          {previewTab === "tables" && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-fadeIn">
              {[
                {
                  id: "T-01",
                  name: "Patio Terrace",
                  status: "Occupied",
                  guest: "Elena Rostova",
                  bill: "$124.50",
                  color: "border-rose-500/30 bg-rose-500/5 text-rose-500",
                },
                {
                  id: "T-02",
                  name: "Window View",
                  status: "Reserved",
                  guest: "Marcus Vance",
                  bill: "$0.00",
                  color: "border-amber-500/30 bg-amber-500/5 text-amber-500",
                },
                {
                  id: "T-03",
                  name: "VIP Salon",
                  status: demoPaymentComplete ? "Available" : "Dining",
                  guest: demoPaymentComplete ? "Ready for Guest" : "Alexander Thorne",
                  bill: demoPaymentComplete ? "Settled" : "$210.00",
                  color: demoPaymentComplete
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                    : "border-sky-500/30 bg-sky-500/5 text-sky-500",
                },
                {
                  id: "T-04",
                  name: "Garden Suite",
                  status: demoTableReserved ? "Reserved" : "Available",
                  guest: demoTableReserved ? "Demo Guest · 7:30 PM" : "Ready for Guest",
                  bill: "--",
                  color: demoTableReserved
                    ? "border-amber-500/30 bg-amber-500/5 text-amber-500"
                    : "border-emerald-500/30 bg-emerald-500/5 text-emerald-500",
                },
              ].map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-amber-500/50 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {t.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.color}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-1">{t.guest}</div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-xs dark:border-slate-800/80">
                    <span className="font-mono text-slate-500">{t.bill}</span>
                    {t.id === "T-04" ? (
                      <button
                        aria-pressed={demoTableReserved}
                        className="text-[11px] font-bold text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
                        onClick={() => {
                          setDemoTableReserved((reserved) => !reserved);
                          setDemoEvent(demoTableReserved ? "Demo reservation released for T-04." : "Demo reservation created for T-04.");
                        }}
                        type="button"
                      >
                        {demoTableReserved ? "Release demo" : "Reserve demo"}
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400">{t.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {previewTab === "kitchen" && (
            <div className="space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  ticket: "#401",
                  table: "T-01",
                  items: "2x Wagyu A5, 1x Truffle Pasta",
                  time: "Cooking (08m)",
                  status: "In Progress",
                  color: "text-amber-500",
                },
                {
                  ticket: "#402",
                  table: "T-03",
                  items: "1x Chilean Seabass, 2x Sphere",
                  time: "Plating (02m)",
                  status: "Finishing",
                  color: "text-sky-500",
                },
                {
                  ticket: "#403",
                  table: "T-02",
                  items: "4x Oysters, 1x Cavatelli",
                  time: demoTicketStatus === "Ready" ? "Ready to serve" : demoTicketStatus === "In Progress" ? "Cooking (01m)" : "Waiting for chef",
                  status: demoTicketStatus,
                  color: demoTicketStatus === "Ready" ? "text-emerald-500" : demoTicketStatus === "In Progress" ? "text-amber-500" : "text-sky-500",
                },
              ].map((k) => (
                <div
                  key={k.ticket}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/50 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {k.ticket} ({k.table})
                    </span>
                    <span className={`text-[10px] font-bold ${k.color}`}>{k.status}</span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {k.items}
                  </div>
                  <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>{k.time}</span>
                    <span className="text-emerald-500 font-bold">View KDS →</span>
                  </div>
                </div>
              ))}
              </div>
              <button
                className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
                onClick={() => {
                  const nextStatus: DemoTicketStatus = demoTicketStatus === "Queued"
                    ? "In Progress"
                    : demoTicketStatus === "In Progress"
                      ? "Ready"
                      : "Queued";
                  setDemoTicketStatus(nextStatus);
                  setDemoEvent(`Sample kitchen ticket #403 moved to ${nextStatus}.`);
                }}
                type="button"
              >
                Advance sample ticket · {demoTicketStatus} → {demoTicketStatus === "Queued" ? "In Progress" : demoTicketStatus === "In Progress" ? "Ready" : "Queued"}
              </button>
            </div>
          )}

          {previewTab === "pos" && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    One-Tap Cashier Settlement & Instant Release
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {demoPaymentComplete
                      ? "Demo payment recorded. Table T-03 is now shown as available."
                      : "Preview a sample invoice settlement and table release. This demo does not process a real payment."}
                  </p>
                </div>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
                <button
                  aria-pressed={demoPaymentComplete}
                  onClick={() => {
                    setDemoPaymentComplete((complete) => {
                      const next = !complete;
                      setDemoEvent(next ? "Demo payment collected for T-03; table released." : "Demo payment reset for T-03.");
                      return next;
                    });
                  }}
                  className={`rounded-xl px-4 py-2.5 font-bold text-xs shadow transition ${demoPaymentComplete ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200" : "bg-emerald-600 text-white hover:bg-emerald-500"}`}
                  type="button"
                >
                  {demoPaymentComplete ? "Reset payment demo" : "Simulate sample payment"}
                </button>
                <button
                  onClick={() => setActiveRole("cashier")}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-xs text-slate-700 transition hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  type="button"
                >
                  View cashier details
                </button>
              </div>
            </div>
          )}

          {previewTab === "inventory" && (
            <div className="animate-fadeIn rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-500">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Truffle Oil · Pantry Stock</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Track stock levels and see how kitchen usage affects inventory.</p>
                    <p className={`mt-2 text-sm font-extrabold ${demoStock <= 10 ? "text-amber-500" : "text-emerald-500"}`}>
                      {demoStock} units remaining {demoStock <= 10 && "· Reorder soon"}
                    </p>
                  </div>
                </div>
                <button
                  disabled={demoStock === 0}
                  className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  onClick={() => {
                    setDemoStock((stock) => Math.max(0, stock - 1));
                    setDemoEvent("Kitchen demo used one unit of truffle oil; inventory count updated.");
                  }}
                  type="button"
                >
                  {demoStock === 0 ? "Sample stock depleted" : "Record sample usage"}
                </button>
              </div>
            </div>
          )}

          {previewTab === "sse" && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 space-y-1.5 transition animate-fadeIn">
              <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span className="text-[11px]">Server-Sent Events Stream (SSE)</span>
                <span className="text-[10px] text-emerald-400 font-bold">LIVE FEED</span>
              </div>
              <div>[10:25:01] SSE_EVENT: Table T-02 reserved by guest & token issued</div>
              <div>[10:25:03] SSE_EVENT: Ticket #402 dispatched to Chef Station 1</div>
              <div className="text-amber-400">
                [10:25:07] SSE_EVENT: Table T-01 bill settled ($124.50) & auto-released
              </div>
              {demoEvent && (
                <div className="break-words text-sky-300" role="status">
                  [LIVE DEMO] SSE_EVENT: {demoEvent}
                </div>
              )}
              <button
                className="mt-2 rounded-lg border border-emerald-500/30 px-3 py-2 font-sans text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/10"
                onClick={() => setDemoEvent("Customer QR session validated and order dispatched to the kitchen queue.")}
                type="button"
              >
                Simulate customer order event
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* CULINARY MENU SHOWCASE SECTION (WITH IMAGES)                  */}
      {/* ============================================================== */}
      <section
        data-drawer-reveal
        id="menu-showcase"
        className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Artisan Gastronomy
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Signature Culinary Collection
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Every dish is crafted with perfection and linked directly to our live table ordering
              stream.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "All Creations" },
              ...landingMenuCategories.map((category) => ({
                id: category.name,
                label: category.name,
              })),
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setLandingMenuCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${landingMenuCategory === cat.id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes Grid with Images */}
        <div id="dishes-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredLandingMenu.map((dish) => (
            <div
              key={dish.id}
              data-drawer-reveal
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={dish.image_url}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-950/80 text-amber-400 backdrop-blur-md border border-amber-500/30 shadow">
                      {dish.is_veg ? "VEG" : "NON-VEG"}
                    </span>
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-950/80 text-white backdrop-blur-md">
                    ${Number(dish.price).toFixed(2)}
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                    {dish.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {dish.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>Explore Dish</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* REAL-TIME PERFORMANCE METRICS RIBBON                           */}
      {/* ============================================================== */}
      <section data-drawer-reveal className="border-y border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 backdrop-blur-md py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
              &lt; 38 ms
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              SSE Event Broadcast Latency
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-500 font-mono">
              100%
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              Tokenized Dining Protection
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-500 font-mono">
              +40%
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              Faster Table Turnover Velocity
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-sky-500 font-mono">
              99.99%
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              Real-Time Kitchen Sync Uptime
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SYSTEM PILLARS (ROLE WORKSPACE DETAILS)                       */}
      {/* ============================================================== */}
      <section data-drawer-reveal id="pillars" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Real-Time Modular Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Engineered for Flawless Restaurant Execution
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Every module works harmoniously. Select a pillar to explore its workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Chef workspace card */}
          <div
            data-drawer-reveal
            onClick={() => setActiveRole("chef")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") setActiveRole("chef");
            }}
            role="button"
            tabIndex={0}
            className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md hover:border-amber-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                Chef Line Display (KDS)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Zero-reload kitchen ticket queue powered by Server-Sent Events. Real-time timers,
                station routing, and dispatching.
              </p>
            </div>
            <div className="pt-6 flex items-center justify-between text-xs font-bold text-amber-500">
              <span>Launch Kitchen</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Cashier workspace card */}
          <div
            data-drawer-reveal
            onClick={() => setActiveRole("cashier")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") setActiveRole("cashier");
            }}
            role="button"
            tabIndex={0}
            className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md hover:border-emerald-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                Cashier POS & Billing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                One-tap receipt settle, invoice splitting, and automatic table occupancy release.
              </p>
            </div>
            <div className="pt-6 flex items-center justify-between text-xs font-bold text-emerald-500">
              <span>Launch POS</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Customer QR Menu Card */}
          <div
            data-drawer-reveal
            onClick={() => setActiveRole("customer")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") setActiveRole("customer");
            }}
            role="button"
            tabIndex={0}
            className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md hover:border-rose-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
                Guarded QR Dining & Menu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                One-time session tokens prevent fraud and double-ordering. High-resolution imagery
                and instantaneous cart calculations.
              </p>
            </div>
            <div className="pt-6 flex items-center justify-between text-xs font-bold text-rose-500">
              <span>Open QR Menu</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Admin workspace card */}
          <div
            data-drawer-reveal
            onClick={() => setActiveRole("admin")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") setActiveRole("admin");
            }}
            role="button"
            tabIndex={0}
            className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md hover:border-sky-500/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                Admin Command Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Floor layout manager, live turnover telemetry, inventory stock, staff access control.
              </p>
            </div>
            <div className="pt-6 flex items-center justify-between text-xs font-bold text-sky-500">
              <span>Open Admin Hub</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* PRICING & DEPLOYMENT PLANS                                     */}
      {/* ============================================================== */}
      <section
        data-drawer-reveal
        id="pricing"
        className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Simple Transparent Plans • Razorpay Test Mode
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Choose Your Hospitality Tier
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Powered by Razorpay Key: {RAZORPAY_TEST_KEY.substring(0, 16)}...
          </p>

          {/* Billing Switch */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span
              className={`text-xs font-semibold ${!annualBilling ? "text-slate-900 dark:text-white" : "text-slate-400"
                }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnualBilling(!annualBilling)}
              className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded-full p-1 relative transition cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded-full bg-amber-500 transition-transform ${annualBilling ? "translate-x-6" : "translate-x-0"
                  }`}
              />
            </button>
            <span
              className={`text-xs font-semibold flex items-center gap-1.5 ${annualBilling ? "text-slate-900 dark:text-white" : "text-slate-400"
                }`}
            >
              <span>Annual</span>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                Save 25%
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plansList.map((plan) => {
            const isSubscribed = activeSubscribedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                data-drawer-reveal
                className={`p-8 rounded-3xl border transition-all flex flex-col justify-between ${isSubscribed
                    ? "border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/30 md:scale-105"
                    : plan.isTrial
                      ? "border-amber-500 bg-white dark:bg-slate-900 shadow-2xl relative ring-2 ring-amber-500/30 md:scale-105"
                      : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60"
                  }`}
              >
                {isSubscribed ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active Subscribed Plan</span>
                  </div>
                ) : plan.isTrial ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                    Most Popular
                  </div>
                ) : null}

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.desc}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                        ₹{plan.priceINR.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400">/ {plan.period}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      (${plan.priceUSD} USD / {plan.period})
                    </div>
                  </div>

                  <ul className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {plan.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300"
                      >
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => router.push("/register")}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${isSubscribed
                        ? "bg-emerald-600 text-white shadow"
                        : plan.isTrial
                          ? "bg-gradient-to-r from-amber-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.01]"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                      }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>
                      {isSubscribed
                        ? "Manage Active Plan"
                        : plan.isTrial
                          ? "Start 14-Day Free Trial"
                          : `Choose Plan (₹${plan.priceINR})`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* FAQ SECTION ACCORDION                                          */}
      {/* ============================================================== */}
      <section
        data-drawer-reveal
        id="faq"
        className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80 space-y-12"
      >
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Got Questions?
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does the Razorpay test mode payment work for slot bookings?",
              a: "When a guest books a table slot, GourmetOS initializes a secure Razorpay checkout modal using the test key (rzp_test_Tku1KEjfGOrzDY). You can test payments using Razorpay's simulated UPI, Netbanking, or Test Card numbers without real monetary charges.",
            },
            {
              q: "How does the Customer Menu open after booking a slot?",
              a: "When you lock a table slot and complete deposit authorization, clicking 'Enter Customer Menu' smoothly slides open the interactive menu right inside the drawer with images, cart totals, and one-tap order dispatching.",
            },
            {
              q: "Can I adjust or turn off the red snake eyes animation effect?",
              a: "Yes! Click the 'Viper Settings' floating pill or the 'Viper FX' button in the navigation bar to slide open the Viper Studio. You can adjust the slither velocity, change the red eye glow intensity, customize scale colors to match your restaurant branding, or toggle cursor tracking.",
            },
            {
              q: "Does the system function if internet connectivity briefly fluctuates?",
              a: "Yes. The frontend client automatically reconnects dropped SSE connections with exponential backoff and maintains a 30-second polling fallback so kitchen orders and bill totals never get lost.",
            },
          ].map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={item.q}
                data-drawer-reveal
                className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-amber-500" : ""
                      }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* FOOTER                                                         */}
      {/* ============================================================== */}
      <footer data-drawer-reveal className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-950/70 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow">
              G
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {BRAND_FULL_NAME}
              </div>
              <div className="text-[11px] text-slate-500">
                Next.js & Python FastAPI Real-Time Architecture • Razorpay Test Mode
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <a href="#menu-showcase" className="hover:text-emerald-500 transition">
              Food Menu
            </a>
            <button
              onClick={() => setActiveRole("chef")}
              className="hover:text-amber-500 transition cursor-pointer"
            >
              Chef Line
            </button>
            <button
              onClick={() => setActiveRole("cashier")}
              className="hover:text-emerald-500 transition cursor-pointer"
            >
              Cashier POS
            </button>
            <button
              onClick={() => setActiveRole("customer")}
              className="hover:text-rose-500 transition cursor-pointer"
            >
              QR Menu
            </button>
            <button
              onClick={() => setActiveRole("admin")}
              className="hover:text-sky-500 transition cursor-pointer"
            >
              Admin Hub
            </button>
            <button
              onClick={() => router.push("/login")}
              className="hover:text-white font-semibold transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/register")}
              className="hover:text-white font-semibold transition cursor-pointer"
            >
              Register
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            &copy; {new Date().getFullYear()} {BRAND_NAME}. Razorpay Test Mode Enabled.
          </div>
        </div>
      </footer>
    </div>
  );
}

interface PlanData {
  id: string;
  name: string;
  priceUSD: number;
  priceINR: number;
  period: string;
  isTrial: boolean;
  desc: string;
  features: string[];
}
