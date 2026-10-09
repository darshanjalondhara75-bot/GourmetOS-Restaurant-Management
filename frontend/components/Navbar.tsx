"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useSidebar } from "@/lib/sidebarContext";
import {
  Utensils,
  Bell,
  LogOut,
  User,
  Shield,
  ChefHat,
  Receipt,
  Menu,
  X,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { getNotifications, markNotificationsRead, NotificationItem } from "@/lib/api";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/branding";
import { useTheme } from "@/lib/themeContext";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { toggleMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  const navRole = portfolioDemoRole || user?.role;
  const demoHref = (href: string) =>
    portfolioDemoRole ? `${href}${href.includes("?") ? "&" : "?"}portfolioDemo=1` : href;

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch {
      // silent catch
    }
  }, [user]);

  useRealtimeUpdates(loadNotifications, [
    "orders",
    "tables",
    "bookings",
    "menu",
    "inventory",
    "shifts",
    "users",
    "notifications",
    "all",
  ]);

  useEffect(() => {
    if (user) void Promise.resolve().then(loadNotifications);
  }, [user, loadNotifications]);

  const handleMarkRead = async () => {
    try {
      await markNotificationsRead();
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silent catch
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-600 border border-purple-100/50 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50">
            <Shield className="w-2.5 h-2.5" /> Admin
          </span>
        );
      case "cashier":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50">
            <Receipt className="w-2.5 h-2.5" /> Cashier
          </span>
        );
      case "user":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100/50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50">
            <User className="w-2.5 h-2.5" /> User
          </span>
        );
      case "chef":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100/50 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50">
            <ChefHat className="w-2.5 h-2.5" /> Chef
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-100/50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <User className="w-2.5 h-2.5" /> Guest
          </span>
        );
    }
  };

  const isTabActive = (path: string) => {
    if (!pathname) return false;
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <div className="h-1 w-full bg-[#6f9d8f]" />

      <nav className="light-nav relative min-h-[60px] px-2 py-3">
        <div className="w-full min-w-0 flex items-center justify-between gap-2">
          {/* Left: Brand Logo & Title */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                if (onToggleSidebar) onToggleSidebar();
                toggleMobileSidebar();
              }}
              className="lg:hidden flex min-h-10 min-w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-[#397765] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-all duration-300 flex-shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h1 className="font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors truncate">
                    {BRAND_NAME}
                  </h1>
                  <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400 opacity-80 shrink-0" />
                </div>
                <p className="hidden sm:block text-[10px] text-slate-500 font-medium tracking-wide mt-0.5 truncate">
                  {BRAND_TAGLINE}
                </p>
              </div>
            </Link>
          </div>

          {/* Center: Dynamic Navigation Pills - hidden on mobile/tablet, shown on desktop */}
          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex items-center justify-center z-10 pointer-events-none w-max max-w-[90vw]">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner pointer-events-auto">
              {navRole !== "user" && (
                <Link
                  href={demoHref("/customer/menu")}
                  className={`px-2 py-1 sm:px-3 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                    isTabActive("/customer/menu")
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60 scale-[1.02]"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-white/60"
                  }`}
                >
                  Digital Menu
                </Link>
              )}

              {navRole === "admin" && (
                <Link
                  href={demoHref("/admin/dashboard")}
                  className={`px-2 py-1 sm:px-3 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                    isTabActive("/admin")
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60 scale-[1.02]"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-white/60"
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}

              {navRole === "cashier" && (
                <Link
                  href={demoHref("/cashier/tables")}
                  className={`px-2 py-1 sm:px-3 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                    isTabActive("/cashier")
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60 scale-[1.02]"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-white/60"
                  }`}
                >
                  Cashier Portal
                </Link>
              )}

              {navRole === "user" && (
                <>
                  <Link
                    href={demoHref("/user/orders")}
                    className={`px-2 py-1 sm:px-3 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 whitespace-nowrap ${isTabActive("/user/orders") ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60 scale-[1.02]" : "text-slate-600 hover:text-indigo-600 hover:bg-white/60"}`}
                  >
                    Orders
                  </Link>
                  <Link
                    href={demoHref("/user/table-booking")}
                    className={`px-2 py-1 sm:px-3 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 whitespace-nowrap ${isTabActive("/user/table-booking") ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60 scale-[1.02]" : "text-slate-600 hover:text-indigo-600 hover:bg-white/60"}`}
                  >
                    Table Booking
                  </Link>
                </>
              )}

              {navRole === "chef" && (
                <Link
                  href={demoHref("/chef/kitchen")}
                  className={`px-2 py-1 sm:px-3 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                    isTabActive("/chef")
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60 scale-[1.02]"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-white/60"
                  }`}
                >
                  Kitchen Panel
                </Link>
              )}
            </div>
          </div>

          {/* Right: Notifications & User Profile */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-600 dark:text-amber-400 transition hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-amber-300"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              suppressHydrationWarning
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all duration-200"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="notification-unread-badge absolute top-0 right-0 px-1 py-0.5 bg-rose-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center animate-pulse ring-1 ring-white shadow-xs">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <>
                      <div
                        className="fixed inset-0 z-40 sm:hidden"
                        onClick={() => setShowNotifications(false)}
                      />
                      <div className="notification-panel fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-14 sm:top-auto sm:mt-2 sm:w-80 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden">
                        <div className="p-3 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bell className="w-3.5 h-3.5 text-amber-500" />
                            <h3 className="font-bold text-xs text-slate-900">Notifications</h3>
                            {unreadCount > 0 && (
                              <span className="notification-unread-count ml-1 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <button
                                onClick={handleMarkRead}
                                className="text-[10px] text-indigo-600 font-bold hover:underline"
                              >
                                Mark all read
                              </button>
                            )}
                            <button
                              onClick={() => setShowNotifications(false)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition sm:hidden"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-xs">
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((n, index) => (
                              <div
                                key={`${n.id}-${index}`}
                                className={`p-3 text-xs transition ${
                                  !n.is_read ? "bg-rose-50/40" : "bg-white hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-semibold text-slate-900 mb-0.5 flex-1">{n.title}</div>
                                  {!n.is_read && (
                                    <span className="notification-unread-dot w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="text-slate-600 leading-relaxed">{n.message}</div>
                                <div className="text-[9px] text-slate-400 mt-1">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 sm:gap-3 pl-1 sm:pl-3 border-l border-slate-200/60">
                  <div className="hidden sm:flex max-w-32 flex-col text-right">
                    <span className="truncate text-xs font-extrabold text-slate-900 leading-tight">
                      {user.name}
                    </span>
                    <div className="mt-0.5">{getRoleBadge(user.role)}</div>
                  </div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Link href="/login" className="btn-primary py-1.5 px-3 text-xs font-bold rounded-lg">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {showLogoutConfirm && (
        <div
          className="logout-modal-overlay fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowLogoutConfirm(false);
          }}
        >
          <div
            className="logout-modal-panel w-full max-w-[min(100%,24rem)] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            aria-describedby="logout-confirm-description"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <LogOut className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="logout-confirm-title" className="text-base font-extrabold text-slate-900">
                  Log out of your account?
                </h2>
                <p id="logout-confirm-description" className="mt-1 text-sm leading-relaxed text-slate-500">
                  You will need to sign in again to access this panel.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary min-h-10 w-full text-sm sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 sm:w-auto"
              >
                <LogOut className="h-4 w-4" />
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
