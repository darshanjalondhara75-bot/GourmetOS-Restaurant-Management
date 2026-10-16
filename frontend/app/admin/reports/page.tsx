"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getPopularItems, getDashboardSummary, getOrderPeriodReport, OrderPeriodReport } from "@/lib/api";
import { BarChart3, TrendingUp, DollarSign, ArrowDownToLine, ShoppingBag, Star, CalendarDays } from "lucide-react";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";

type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export default function ReportsPage() {
  const [popularData, setPopularData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [periodReport, setPeriodReport] = useState<OrderPeriodReport | null>(null);
  const [periodLoading, setPeriodLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const minimumReportYear = currentYear - 5;
  const maximumReportYear = currentYear + 5;

  useEffect(() => {
    async function loadReports() {
      try {
        const [popular, sum] = await Promise.allSettled([
          getPopularItems(),
          getDashboardSummary()
        ]);
        if (popular.status === "fulfilled") setPopularData(popular.value);
        if (sum.status === "fulfilled") setSummary(sum.value);
      } catch (err) {
        console.error(err);
      }
    }
    loadReports();
  }, []);

  useEffect(() => {
    let active = true;
    setPeriodLoading(true);
    getOrderPeriodReport(period, reportDate)
      .then((data) => { if (active) setPeriodReport(data); })
      .catch((err) => console.error("Failed to load period report:", err))
      .finally(() => { if (active) setPeriodLoading(false); });
    return () => { active = false; };
  }, [period, reportDate]);

  useRealtimeUpdates(() => {
    void Promise.allSettled([
      getPopularItems().then(setPopularData),
      getDashboardSummary().then(setSummary),
      getOrderPeriodReport(period, reportDate).then(setPeriodReport),
    ]);
  }, ["orders"]);

  const changePeriod = (nextPeriod: ReportPeriod) => {
    setPeriod(nextPeriod);
    const now = new Date();
    setReportDate(nextPeriod === "daily" || nextPeriod === "weekly"
      ? now.toISOString().slice(0, 10)
      : nextPeriod === "monthly"
        ? now.toISOString().slice(0, 7)
        : now.toISOString().slice(0, 4));
  };

  const chartData = periodReport?.chart_data || [];
  const maxSales = Math.max(...chartData.map((entry) => entry.sales), 1);

  return (
    <AppShell>

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="badge badge-purple">Reports</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">• Data Visualization</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Sales &amp; Performance Reports
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Analytics for revenue, orders, popular items, and shifts.
              </p>
            </div>
            <button onClick={() => window.print()} className="btn-secondary text-xs font-bold py-2 sm:py-2.5 w-full sm:w-auto">
              <ArrowDownToLine className="w-4 h-4" /> Export PDF
            </button>
          </div>

          <section className="light-card p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg">Order Reports</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Track orders and collected revenue by period.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl" role="tablist" aria-label="Order report period">
                {(["daily", "weekly", "monthly", "yearly"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => changePeriod(option)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition ${period === option ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"}`}
                    role="tab"
                    aria-selected={period === option}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-5">
              <label htmlFor="report-date" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Select {period}:
              </label>
              <div className="report-date-control relative sm:w-auto">
                <input
                  id="report-date"
                  type={period === "daily" || period === "weekly" ? "date" : period === "monthly" ? "month" : "number"}
                  min={period === "yearly" ? minimumReportYear : undefined}
                  max={period === "yearly" ? maximumReportYear : undefined}
                  step={period === "yearly" ? 1 : undefined}
                  value={reportDate}
                  onChange={(event) => {
                    if (period !== "yearly") {
                      setReportDate(event.target.value);
                      return;
                    }
                    const selectedYear = Number(event.target.value);
                    if (!Number.isNaN(selectedYear)) {
                      setReportDate(String(Math.min(Math.max(selectedYear, minimumReportYear), maximumReportYear)));
                    }
                  }}
                  className="custom-input report-date-input pr-12 text-xs font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  aria-label={`Select ${period} report period`}
                />
                {period !== "yearly" && (
                  <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                )}
              </div>
            </div>

            {periodLoading ? (
              <div className="py-8 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">Loading {period} report...</div>
            ) : periodReport && (
              <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="h-fit min-w-0 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{period} orders</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">{periodReport.total_orders}</p>
                </div>
                <div className="h-fit min-w-0 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Collected revenue</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">${periodReport.total_revenue.toFixed(2)}</p>
                </div>
                <div className="h-fit min-w-0 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Paid orders</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">{periodReport.paid_orders}</p>
                </div>
                <div className="h-fit min-w-0 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Order status</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Object.entries(periodReport.status_breakdown).map(([status, count]) => {
                      const statusStyles: Record<string, string> = {
                        Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800",
                        Ready: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-800",
                        Cooking: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800",
                        Preparing: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800",
                        Pending: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800",
                        Accepted: "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
                      };
                      const style = statusStyles[status] || "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700";
                      return (
                        <div key={status} className={`flex min-w-0 items-center justify-between gap-2 p-2 rounded-lg ring-1 ${style}`}>
                          <span className="min-w-0 break-words text-[10px] font-bold">{status}</span>
                          <span className="shrink-0 text-xs font-black">{count}</span>
                        </div>
                      );
                    })}
                    {Object.keys(periodReport.status_breakdown).length === 0 && (
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 col-span-2 text-center py-2">No orders</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Summary KPI Row */}
          {summary && (
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="light-card h-fit min-w-0 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Sales</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">${summary.total_sales?.toFixed(2)}</p>
              </div>
              <div className="light-card h-fit min-w-0 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Orders</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{summary.total_orders}</p>
              </div>
              <div className="light-card h-fit min-w-0 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <Star className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{summary.completed_orders}</p>
              </div>
            </div>
          )}

          {/* Bar Chart */}
          <div className="light-card p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg">{period} Revenue Analytics</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sales and orders for the selected {period} period</p>
              </div>
              <span className="badge badge-emerald flex items-center gap-1 self-start sm:self-auto">
                <TrendingUp className="w-3.5 h-3.5" /> +18.4% Growth
              </span>
            </div>

            {/* Scrollable chart on mobile */}
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="h-48 sm:h-64 flex items-end gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800 min-w-full lg:min-w-[720px]">
                {chartData.map((entry, idx) => {
                  const heightPercent = entry.sales > 0 ? Math.max((entry.sales / maxSales) * 100, 4) : 2;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end min-w-[30px]">
                      <div className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        ${entry.sales.toFixed(2)} · {entry.orders} orders
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[40px] sm:max-w-[48px] bg-gradient-to-t from-indigo-600 to-blue-500 rounded-t-xl group-hover:from-indigo-700 group-hover:to-blue-600 transition-all shadow-md"
                      />
                      <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">{entry.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dish Revenue Contribution */}
            <div className="mt-6 p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-6">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-tight">Dish Revenue Contribution</h3>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Top Performing Dishes</div>
              </div>
              <div className="space-y-3">
                {popularData.map((item, idx) => {
                  const totalRevenue = popularData.reduce((sum, i) => sum + i.revenue, 0);
                  const contributionPercent = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                  const isTop = idx === 0;

                  return (
                    <div
                      key={idx}
                      className={`group relative flex flex-col gap-3 p-4 rounded-2xl border transition-all ${
                        isTop
                        ? "bg-indigo-50/60 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 shadow-sm"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md"
                      }`}
                    >
                      {/* Top Row: Rank, Name (full width on mobile) · Category + Revenue */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black border transition-colors shrink-0 ${
                            isTop
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 group-hover:border-indigo-400 group-hover:text-indigo-600"
                          }`}>
                            {idx + 1}
                          </div>
                          <p className="min-w-0 flex-1 text-sm font-extrabold text-slate-900 dark:text-slate-100 break-words sm:truncate">
                            {item.name}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-tighter shrink-0">
                            {item.category}
                          </span>
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100 tabular-nums shrink-0">${item.revenue.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Bottom Row: Orders & Progress Bar */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {item.orders_count} orders
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isTop ? "bg-indigo-600" : "bg-gradient-to-r from-indigo-500 to-blue-500"}`}
                            style={{ width: `${contributionPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-10 text-right tabular-nums">
                          {contributionPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
                {popularData.length === 0 && (
                  <div className="text-center py-10 text-sm font-medium text-slate-400">
                    No popular item data available.
                  </div>
                )}
              </div>
            </div>
          </div>
    </AppShell>
  );
}
