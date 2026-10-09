"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useSidebar } from "@/lib/sidebarContext";
import {
  LayoutDashboard,
  Users,
  Grid,
  Clock,
  UtensilsCrossed,
  Receipt,
  BarChart3,
  ChefHat,
  Smartphone,
  ChevronRight,
  X,
  Utensils,
  ClipboardList,
  Table2,
  PackageCheck,
  Crown,
} from "lucide-react";
import { BRAND_NAME, BRAND_EDITION } from "@/lib/branding";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isMobileOpen, closeMobileSidebar } = useSidebar();
  const isPortfolioDemo = searchParams.get("portfolioDemo") === "1";
  const portfolioDemoRole = isPortfolioDemo
    ? pathname?.startsWith("/chef")
      ? "chef"
      : pathname?.startsWith("/cashier")
        ? "cashier"
        : pathname?.startsWith("/user")
          ? "user"
          : pathname?.startsWith("/admin")
            ? "admin"
            : null
    : null;

  const role = portfolioDemoRole || user?.role || "admin";

  const adminNavItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Table Management", href: "/admin/tables", icon: Grid },
    { label: "View All Orders", href: "/admin/orders", icon: Receipt },
    { label: "Shift Management", href: "/admin/shifts", icon: Clock },
    { label: "Sales Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "Inventory & Audit", href: "/admin/inventory", icon: PackageCheck },
  ];

  const cashierNavItems = [
    { label: "Tables View", href: "/cashier/tables", icon: Grid },
    { label: "Open Bills", href: "/cashier/orders", icon: Receipt },
    { label: "Payment History", href: "/cashier/payments", icon: Receipt },
  ];

  const chefNavItems = [
    { label: "Kitchen Queue", href: "/chef/kitchen", icon: ChefHat },
    { label: "Inventory & Stock", href: "/chef/inventory", icon: PackageCheck },
    { label: "Customer Menu", href: "/customer/menu", icon: UtensilsCrossed },
  ];

  const userNavItems = [
    { label: "Order History", href: "/user/orders", icon: ClipboardList },
    { label: "Table Booking", href: "/user/table-booking", icon: Table2 },
    { label: "Membership Plans", href: "/user/plans", icon: Crown },
  ];


  const publicNavItems = [
    { label: "Customer Menu", href: "/customer/menu", icon: Smartphone },
  ];

  let currentNav = adminNavItems;
  if (role === "cashier") currentNav = cashierNavItems;
  if (role === "chef") currentNav = chefNavItems;
  if (role === "user") currentNav = userNavItems;
  if (portfolioDemoRole) {
    currentNav = currentNav.map((item) => ({
      ...item,
      href: `${item.href}${item.href.includes("?") ? "&" : "?"}portfolioDemo=1`,
    }));
  }

  const handleLinkClick = () => {
    if (onClose) onClose();
    closeMobileSidebar();
  };

  return (
    <>
      {/* Mobile Dark Backdrop */}
      {isMobileOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Component - Full-height drawer on mobile, sticky sidebar on desktop */}
      <aside
        className={`sidebar-shell fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full lg:sticky lg:top-[4.25rem] lg:h-[calc(100dvh-4.25rem)] lg:z-30 lg:w-[var(--sidebar-width)] lg:flex-none bg-[#16362f] border-r border-[#2f6558] transition-transform duration-300 ease-in-out shrink-0 overflow-x-hidden overflow-y-auto overscroll-contain shadow-2xl lg:shadow-none ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="p-4 pb-8 flex min-h-full flex-col justify-between min-w-[256px]">
          <div className="space-y-5">
            {/* Mobile-Only Drawer Header with Logo and Close Button */}
            <div className="flex lg:hidden items-center justify-between pb-3 border-b border-white/15">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e8c982] flex items-center justify-center text-[#16362f]">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <p className="sidebar-brand font-extrabold text-sm leading-none">{BRAND_NAME}</p>
                  <p className="sidebar-muted text-[10px] font-medium mt-0.5">Staff Portal</p>
                </div>
              </div>
              <button
                onClick={closeMobileSidebar}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Staff Role Card */}
            <div className="p-3 bg-[#1f4a41] rounded-2xl border border-[#e8c982]/35 flex items-center gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-[#e8c982] text-[#16362f] flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {role.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <p className="sidebar-muted text-[10px] font-semibold uppercase tracking-wider">Active Panel</p>
                  <p className="sidebar-brand text-sm font-bold capitalize truncate">{role} Mode</p>
                </div>
              </div>
            </div>

            {/* Role Navigation Links */}
            <div>
              <p className="sidebar-section px-3 text-[11px] font-bold uppercase tracking-wider mb-2">
                Management
              </p>
              <nav className="space-y-1">
                {currentNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      aria-current={isActive ? "page" : undefined}
                      className={`sidebar-link flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition ${isActive ? "sidebar-link-active" : "sidebar-link-idle"
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4 opacity-75 shrink-0" />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Customer Facing Links */}
            {role !== "chef" && role !== "user" && (
              <div>
                <p className="sidebar-section px-3 text-[11px] font-bold uppercase tracking-wider mb-2">
                  Public Portal
                </p>
                <nav className="space-y-1">
                  {publicNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleLinkClick}
                        aria-current={isActive ? "page" : undefined}
                        className={`sidebar-link flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition ${isActive ? "sidebar-link-active" : "sidebar-link-idle"
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>

          {/* Footer info */}
          <div className="p-3 bg-[#1f4a41] rounded-xl border border-white/10 text-center">
            <p className="sidebar-brand text-xs font-semibold">{BRAND_NAME} {BRAND_EDITION}</p>
            <p className="sidebar-muted text-[10px] mt-0.5">Python FastAPI + Next.js</p>
          </div>
        </div>
      </aside>

    </>
  );
};
