"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/authContext";
import { DiningTable, getOrders, getTables, RestaurantOrder } from "@/lib/api";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";
import {
  CheckCircle2,
  Grid,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Receipt,
  ArrowRight,
  ShoppingBag,
  Clock,
} from "lucide-react";
import Link from "next/link";

const statusStyles: Record<string, string> = {
  Available: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
  Occupied: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
  Reserved: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400",
  Cleaning: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400",
};

const iconBg: Record<string, string> = {
  Available: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  Occupied: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  Reserved: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
  Cleaning: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400",
};

export default function CashierTablesPage() {
  const { user, loading: authLoading } = useAuth();
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [tableData, orderData] = await Promise.all([getTables(), getOrders()]);
      setTables(tableData);
      setOrders(orderData);
    } catch (err) {
      console.error("Failed to load cashier table view:", err);
    } finally {
      setLoading(false);
    }
  };

  useRealtimeUpdates(loadData, ["tables", "bookings", "orders"]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadData();
  }, [user, authLoading]);

  const toggleOrderItems = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const ordersForTable = (tableNumber: string) =>
    orders.filter(
      (order) =>
        order.table_number === tableNumber &&
        order.status !== "Completed" &&
        order.status !== "Cancelled"
    );

  const unpaidForTable = (tableNumber: string) =>
    ordersForTable(tableNumber).filter((o) => o.payment_status === "Unpaid");

  const statusCount = (status: string) =>
    tables.filter((table) => table.status === status).length;

  const summaryItems = ["Available", "Occupied", "Reserved", "Cleaning"] as const;

  return (
    <AppShell>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-emerald">Cashier</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">• Table Overview</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Tables View
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 break-words">
                Monitor every table and view customer order items. Go to Open Bills to collect payments.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={loadData}
                className="btn-secondary text-xs font-bold min-h-10 px-3"
                disabled={loading}
                title="Refresh tables"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Status Summary Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summaryItems.map((status) => (
              <div
                key={status}
                className={`rounded-2xl border px-4 py-3 transition-colors ${statusStyles[status]}`}
              >
                <p className="text-xs font-bold uppercase tracking-wide">{status}</p>
                <p className="text-2xl font-black mt-1">{statusCount(status)}</p>
              </div>
            ))}
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-4 py-3">
            <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
              <span className="font-bold">View-only mode:</span> This page shows table status and customer order items.
              To collect a payment, use the Open Bills page.
            </p>
          </div>

          {/* Table Cards Grid */}
          {loading && tables.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
              <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading tables...</p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 xl:columns-3 gap-4">
              {tables.map((table) => {
                const unpaid = unpaidForTable(table.table_number);
                const allOrders = ordersForTable(table.table_number);
                const isPaid = allOrders.length > 0 && unpaid.length === 0;

                return (
                  <div
                    key={table.id}
                    className="break-inside-avoid mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 flex flex-col h-fit"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between p-4 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg[table.status] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                          <Grid className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="font-black text-slate-900 dark:text-slate-100 leading-tight">
                            Table #{table.table_number}
                          </h2>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{table.capacity} seats</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full border ${statusStyles[table.status] || "border-slate-200 bg-slate-50 text-slate-600"}`}>
                        {table.status}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100 dark:border-slate-800 mx-4" />

                    {/* Orders section */}
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      {unpaid.length > 0 ? (
                        unpaid.map((order) => {
                          const isExpanded = expandedOrders[order.id];
                          const itemTotal = order.items.reduce(
                            (sum: number, item: any) => sum + item.price * item.quantity,
                            0
                          );
                          return (
                            <div key={order.id} className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20 overflow-hidden">
                              {/* Order Summary Row */}
                              <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                                    Unpaid Order
                                  </p>
                                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">{order.order_id}</p>
                                  {order.order_token && (
                                    <p className="mt-0.5 text-[10px] font-black tracking-wide text-[#176b57] dark:text-emerald-300">
                                      Token {order.order_token}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                      <Clock className="w-2.5 h-2.5" />
                                      {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    <span className="flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                      <ShoppingBag className="w-2.5 h-2.5" />
                                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-base font-black text-slate-900 dark:text-slate-100">
                                    ${order.total_amount.toFixed(2)}
                                  </p>
                                  {order.payment_method === "Online" && (
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                      ₹{(order.paid_amount ?? (order.total_amount * (order.payment_exchange_rate || 83))).toFixed(2)} INR
                                    </p>
                                  )}
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                                    {order.status}
                                  </span>
                                </div>
                              </div>

                              {/* Toggle Order Items Button */}
                              <button
                                onClick={() => toggleOrderItems(order.id)}
                                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Order Items
                                  </span>
                                  <span className="text-[10px] font-bold bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-500">
                                    {order.items.length}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold opacity-70">View Details</span>
                                  {isExpanded
                                    ? <ChevronUp className="w-3 h-3" />
                                    : <ChevronDown className="w-3 h-3" />
                                  }
                                </div>
                              </button>

                              {/* Expandable Items List */}
                              <div
                                className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                  }`}
                              >
                                <div className="overflow-hidden">
                                  <div className="pt-2 grid grid-cols-1 gap-2">
                                    {order.items.map((item: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600"
                                      >
                                        <img
                                          src={item.image_url || "https://placehold.co/100x100?text=Food"}
                                          alt={item.name}
                                          className="h-8 w-8 rounded-md object-cover bg-slate-200 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                            {item.name}
                                          </p>
                                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                                          </p>
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                          ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                            </div>
                          );
                        })
                      ) : isPaid ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/20 py-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> Payment completed
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 py-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {table.status === "Available" ? "No active order" : "No unpaid order"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

    </AppShell>
  );
}
