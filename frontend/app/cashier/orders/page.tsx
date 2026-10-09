"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/authContext";
import { getOrders, payOrder, RestaurantOrder } from "@/lib/api";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";
import { Banknote, CreditCard, RefreshCw, Receipt, Table as TableIcon, Clock, ChevronDown, ChevronUp } from "lucide-react";

export default function CashierUnpaidBillsPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [summaries, setSummaries] = useState({
    totalTransactions: 0,
    totalCollected: 0,
    totalRefunded: 0,
  });

  const loadUnpaidBills = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      // Filter for Unpaid bills that aren't cancelled
      const unpaid = data.filter(
        (order) => order.payment_status === "Unpaid" && order.status !== "Cancelled"
      );
      setOrders(unpaid);
    } catch (err) {
      console.error("Failed to load unpaid bills:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const data = await getOrders();
      setOrders(data.filter(
        (order) => String(order.payment_status) === "Unpaid" && order.status !== "Cancelled"
      ));

      const collected = data
        .filter((order) => String(order.payment_status) === "Paid" && order.status !== "Cancelled")
        .reduce((total, order) => total + order.total_amount, 0);
      const refunded = data
        .filter((order) => String(order.payment_status) === "Refunded" || order.status === "Cancelled")
        .reduce((total, order) => total + order.total_amount, 0);
      const transactions = data.filter(order =>
        String(order.payment_status) === "Paid" ||
        String(order.payment_status) === "Refunded" ||
        order.status === "Cancelled"
      ).length;

      setSummaries({
        totalTransactions: transactions,
        totalCollected: collected,
        totalRefunded: refunded,
      });
    } catch (err) {
      console.error("Failed to load cashier data:", err);
    } finally {
      setLoading(false);
    }
  };

  useRealtimeUpdates(fetchAllData, ["orders"]);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchAllData();
  }, [user, authLoading]);

  const toggleItems = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handlePayment = async (order: RestaurantOrder, method: "Cash" | "Card" | "At Counter") => {
    setProcessingOrder(`${order.order_id}-${method}`);
    try {
      await payOrder(order.order_id, method);
      await loadUnpaidBills();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to process payment.");
    } finally {
      setProcessingOrder(null);
    }
  };

  return (
    <AppShell>
          {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-emerald">Cashier</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">• Settlement View</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight break-words">Open Unpaid Bills</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 break-words">Consolidated list of all outstanding payments across the restaurant.</p>
            </div>
            <button
              onClick={loadUnpaidBills}
              disabled={loading}
              className="btn-secondary text-xs font-bold w-full sm:w-auto min-h-10 justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Bills
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 transition-colors">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Transactions</p>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">{summaries.totalTransactions}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 transition-colors">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Total Collected</p>
              <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">${summaries.totalCollected.toFixed(2)}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 transition-colors">
              <p className="text-xs font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400">Total Refunded</p>
              <p className="text-3xl font-black text-rose-700 dark:text-rose-400 mt-1">${summaries.totalRefunded.toFixed(2)}</p>
            </div>
          </div>

          {/* Bills List */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex min-w-0 items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="truncate text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">Pending Settlements</h2>
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                {orders.length} Open Bills
              </span>
            </div>

            {loading && orders.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-400">Loading unpaid bills...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-20 text-center space-y-3">
                <div className="flex justify-center">
                  <CreditCard className="w-12 h-12 text-slate-200" />
                </div>
                <p className="text-sm font-semibold text-slate-400">No open unpaid bills found.</p>
              </div>
            ) : (
              <div className="p-3 sm:p-4 lg:p-5 bg-slate-50/30 dark:bg-slate-900/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrders[order.id];
                    return (
                      <div key={order.id} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md flex flex-col">
                        {/* Card Top Section */}
                        <div className="p-3.5 sm:p-4 flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-800">
                            <Receipt className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2 mb-1">
                              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 break-all leading-tight">{order.order_id}</h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600 whitespace-nowrap shrink-0 self-start sm:self-auto">
                                {order.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                              <span className="flex items-center gap-1">
                                <TableIcon className="w-3 h-3" /> Table #{order.table_number}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            </div>
                            {order.order_token && (
                              <p className="mt-1.5 text-[10px] font-black tracking-wide text-[#176b57] dark:text-emerald-300">
                                Token {order.order_token}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Order Items Section */}
                        <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4">
                          <div className="space-y-2">
                            <button
                              onClick={() => toggleItems(order.id)}
                              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Order Items</span>
                                <span className="text-[10px] font-bold bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-500">
                                  {order.items.length}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold opacity-70">View Details</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </div>
                            </button>

                            <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                              <div className="overflow-hidden">
                                <div className="pt-2 grid grid-cols-1 gap-2">
                                  {order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600">
                                      <img
                                        src={item.image_url || "https://placehold.co/100x100?text=Food"}
                                        alt={item.name}
                                        className="h-8 w-8 rounded-md object-cover bg-slate-200"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                                      </div>
                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Professional Payment Footer */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">Total Amount</span>
                            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums">${order.total_amount.toFixed(2)}</span>
                          </div>
                          {order.payment_method === "Online" ? (
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                              Online payment pending
                            </span>
                          ) : (
                            <div className="flex min-w-0 flex-1 flex-col sm:flex-row gap-2">
                              {order.payment_method === "At Counter" ? (
                                <button
                                  onClick={() => handlePayment(order, "At Counter")}
                                  disabled={!!processingOrder}
                                  className="btn-emerald min-w-0 flex-1 whitespace-nowrap px-3 h-10 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  {processingOrder === `${order.order_id}-At Counter` ? "Processing..." : "Collect Payment"}
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handlePayment(order, "Cash")}
                                    disabled={!!processingOrder}
                                    className="btn-emerald min-w-0 flex-1 whitespace-nowrap px-3 h-10 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                                  >
                                    {processingOrder === `${order.order_id}-Cash` ? "Processing..." : <><Banknote className="w-4 h-4" /> Cash</>}
                                  </button>
                                  <button
                                    onClick={() => handlePayment(order, "Card")}
                                    disabled={!!processingOrder}
                                    className="btn-primary min-w-0 flex-1 whitespace-nowrap px-3 h-10 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                                  >
                                    {processingOrder === `${order.order_id}-Card` ? "Processing..." : <><CreditCard className="w-4 h-4" /> Card</>}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
    </AppShell>
  );
}
