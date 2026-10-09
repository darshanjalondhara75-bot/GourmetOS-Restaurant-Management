"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/authContext";
import {
  getDashboardSummary,
  getOrders,
  getPopularItems,
  getInventorySummary,
  DashboardSummary,
  InventorySummary,
  RestaurantOrder
} from "@/lib/api";
import {
  DollarSign,
  ShoppingBag,
  Grid,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Users,
  BarChart3,
  Activity,
  ChefHat,
  CircleCheck,
  TimerReset
} from "lucide-react";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/branding";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";


export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<RestaurantOrder[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);

  const loadData = async () => {
    try {
      const [sumResult, ordersResult, popularResult, inventoryResult] = await Promise.allSettled([
        getDashboardSummary(),
        getOrders(),
        getPopularItems(),
        getInventorySummary(),
      ]);
      if (sumResult.status === "fulfilled") {
        setSummary(sumResult.value);
      } else {
        setSummary({
          total_sales: 0,
          total_orders: 0,
          pending_orders: 0,
          completed_orders: 0,
          active_tables: 0,
          total_tables: 6,
          active_shifts: 0
        });
      }

      if (ordersResult.status === "fulfilled" && Array.isArray(ordersResult.value)) {
        setRecentOrders(ordersResult.value.slice(0, 5));
      }
      if (popularResult.status === "fulfilled" && Array.isArray(popularResult.value)) {
        setPopularItems(popularResult.value);
      }
      if (inventoryResult.status === "fulfilled") setInventorySummary(inventoryResult.value);
    } catch (err) {
      console.warn("Dashboard data load notice:", err);
    } finally {
      setLoading(false);
    }
  };

  useRealtimeUpdates(loadData, ["orders", "tables", "bookings", "shifts", "inventory", "users", "menu"]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadData();
  }, [user, authLoading]);
  const getOrderStatus = (status: string) => {
    const normalizedStatus = status === "Preparing" ? "Cooking" : status;
    const styles = {
      Completed: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800",
      Ready: "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-800",
      Cooking: "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800",
      Pending: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800",
      Accepted: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
    };
    return { label: normalizedStatus, className: styles[normalizedStatus as keyof typeof styles] || styles.Pending };
  };


  return (
    <AppShell>
          {/* Operations Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="flex flex-col gap-4 p-5 sm:p-6 lg:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> System live
                  </span>
                  <span className="text-xs text-slate-300 dark:text-slate-600">/</span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Admin control room</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{BRAND_NAME} Operations</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Good to see you, {user?.name || "Admin"}. Here is what needs your attention today.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-center lg:justify-start">
                <Link href="/admin/users" className="btn-secondary text-xs font-bold py-2.5 w-full sm:w-auto justify-center">
                  <Users className="w-4 h-4" /> Manage Users
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-0 border-t border-slate-100 dark:border-slate-800">
              <div className="p-5 bg-emerald-50/60 dark:bg-emerald-900/20 border border-slate-100 dark:border-slate-800 rounded-xl sm:border-r sm:border-l-0 sm:border-t-0 sm:border-b-0 sm:rounded-none">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Today&apos;s sales</span>
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-3">${summary?.total_sales.toFixed(2) || "0.00"}</p>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> +14.2% from yesterday</p>
              </div>
              <div className="p-5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl sm:border-r sm:border-l-0 sm:border-t-0 sm:border-b-0 sm:rounded-none">
                <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Orders</span><ShoppingBag className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /></div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-3">{summary?.total_orders || 0}</p>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{summary?.pending_orders || 0} active in kitchen</p>
              </div>
              <div className="p-5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl sm:border-r sm:border-l-0 sm:border-t-0 sm:border-b-0 sm:rounded-none">
                <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tables in use</span><Grid className="w-4 h-4 text-amber-500 dark:text-amber-400" /></div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-3">{summary?.active_tables || 0}<span className="text-base text-slate-400 dark:text-slate-500"> / {summary?.total_tables || 6}</span></p>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">Dining tables active</p>
              </div>
              <div className="p-5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl sm:border-l-0 sm:border-t-0 sm:border-b-0 sm:rounded-none">
                <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Staff on shift</span><Clock className="w-4 h-4 text-purple-500 dark:text-purple-400" /></div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-3">{summary?.active_shifts || 0}</p>
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1">Currently scheduled</p>
              </div>
            </div>
          </div>

          {/* Inventory Snapshot */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div><h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Inventory Snapshot</h2><p className="text-xs text-slate-400 mt-1">Stock value, purchase spend, wastage and replenishment needs.</p></div>
              <Link href="/admin/inventory" className="text-xs font-black text-indigo-600 hover:underline">Open Inventory & Audit →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                ["Inventory Value", `₹${Number(inventorySummary?.total_inventory_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                ["Total Purchase Cost", `₹${Number(inventorySummary?.total_purchase_cost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                ["Today's Consumption", `₹${Number(inventorySummary?.todays_consumption || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                ["Today's Wastage", `₹${Number(inventorySummary?.wastage || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                ["Low Stock Items", inventorySummary?.low_stock_items || 0],
                ["Pending Requirements", inventorySummary?.pending_requirements || 0],
              ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 p-3"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1.5 text-lg font-black text-slate-900 dark:text-slate-100">{String(value)}</p></div>)}
            </div>
          </section>

          {/* Section: Live Orders & Menu Pulse */}
          <div className="space-y-6">
            <section className="w-full light-card border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30"><Activity className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /></span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Live feed</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">Recent customer orders</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">The latest activity across your dining room.</p>
                </div>
                <Link href="/admin/reports" className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 transition hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 shrink-0 w-full sm:w-auto">
                  View reports <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="relative space-y-2.5">
                {recentOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 py-12 text-center text-sm text-slate-400 dark:text-slate-500">{loading ? "Loading live orders…" : "No recent orders recorded"}</div>
                ) : (
                  recentOrders.map((ord) => {
                    const orderStatus = getOrderStatus(ord.status);
                    return (
                      <div key={ord.id} className="group flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 transition hover:border-indigo-100 dark:hover:border-indigo-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 hover:shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {ord.status === "Completed" ? <CircleCheck className="w-5 h-5" /> : ord.status === "Cooking" || ord.status === "Preparing" ? <ChefHat className="w-5 h-5" /> : <TimerReset className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-x-2 gap-y-1">
                              <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{ord.order_id}</span>
                              <span className="rounded-md bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-slate-600 dark:text-slate-400">TABLE {ord.table_number}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed truncate sm:whitespace-normal">{ord.items?.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 text-right mt-2 sm:mt-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100">${ord.total_amount.toFixed(2)}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ring-1 ${orderStatus.className}`}>{orderStatus.label}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="w-full light-card overflow-hidden border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 pb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30"><BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /></span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Menu pulse</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">Top performing dishes</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Revenue leaders from recent orders.</p>
                </div>
                <Link href="/customer/menu" className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 transition shrink-0 w-full sm:w-auto" title="Open customer menu">
                  Menu <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {popularItems.length === 0 ? (
                <div className="mx-5 mb-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 py-8 text-center text-sm text-slate-400 dark:text-slate-500">No menu performance data yet.</div>
              ) : (
                <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">
                  {popularItems.slice(0, 4).map((item, idx) => {
                    const isTopItem = idx === 0;
                    return (
                      <div key={idx} className={`relative flex min-w-0 items-center gap-3 rounded-xl border p-4 shadow-sm transition ${isTopItem ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20"}`}>
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${isTopItem ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                          0{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-extrabold text-slate-900 dark:text-slate-100">{item.name}</p>
                            <span className="shrink-0 text-xs font-black text-indigo-700 dark:text-indigo-400">${item.revenue.toFixed(2)}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            <span className="truncate">{item.category}</span>
                            <span className="shrink-0">{item.orders_count} orders</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
    </AppShell>
  );
}
