"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/authContext";
import { getOrders, RestaurantOrder } from "@/lib/api";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";
import { printProfessionalReceipt } from "@/lib/receiptPrinter";
import { Check, Clipboard, Clock3, CreditCard, MapPin, Printer, RefreshCw, Receipt } from "lucide-react";

export default function CashierPaymentHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data.filter((order) => order.payment_status === "Paid"));
    } catch (err) {
      console.error("Failed to load payment history:", err);
    } finally {
      setLoading(false);
    }
  };

  useRealtimeUpdates(loadPayments, ["orders"]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadPayments();
  }, [user, authLoading]);

  const sortedOrders = [...orders].sort((first, second) =>
    new Date(second.paid_at || second.created_at).getTime() - new Date(first.paid_at || first.created_at).getTime()
  );
  const inrCollected = orders
    .filter((order) => order.payment_currency === "INR")
    .reduce((total, order) => total + (order.paid_amount ?? order.total_amount), 0);
  const usdCollected = orders
    .filter((order) => order.payment_currency !== "INR")
    .reduce((total, order) => total + order.total_amount, 0);
  const formatAmount = (amount: number, currency?: string) =>
    `${currency === "INR" ? "₹" : "$"}${amount.toFixed(2)}`;

  const copyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedOrderId(orderId);
      window.setTimeout(() => setCopiedOrderId(null), 1600);
    } catch {
      setCopiedOrderId(null);
    }
  };

  const printReceipt = (order: RestaurantOrder) => {
    printProfessionalReceipt(order);
  };

  const formatCollectedAt = (date: string) => new Date(date).toLocaleString([], {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <AppShell>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-emerald">Cashier</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">• Completed Transactions</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight break-words">Collected Payment History</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 break-words">Review payments collected from each dining table.</p>
              </div>
              <button onClick={loadPayments} disabled={loading} className="btn-secondary text-xs font-bold w-full sm:w-auto min-h-10 justify-center" title="Refresh payment history">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 transition-colors">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Collected Transactions</p>
                <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">{orders.length}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-5 transition-colors">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Collected by currency</p>
                <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  Online: {formatAmount(inrCollected, "INR")}
                  <span className="mt-1 block text-sm font-bold text-slate-600 dark:text-slate-300">
                    At counter: {formatAmount(usdCollected, "USD")}
                  </span>
                </p>
              </div>
            </div>

            {/* Records Section */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
              <div className="flex items-center gap-2 p-5 border-b border-slate-100 dark:border-slate-800">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Payment Records</h2>
              </div>
              {sortedOrders.length === 0 ? (
                <div className="p-12 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">No collected payments yet.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 bg-slate-50/40 dark:bg-slate-900/40 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 xl:grid-cols-3">
                  {sortedOrders.map((order) => {
                    const copied = copiedOrderId === order.order_id;
                    return (
                      <article key={order.id} className="group min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5 backdrop-blur-md">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-800">
                                <Receipt className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Order ID</span>
                                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800">Paid</span>
                                </div>
                              </div>
                            </div>
                            <p className="shrink-0 whitespace-nowrap text-lg font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                              {formatAmount(order.paid_amount ?? order.total_amount, order.payment_currency)}
                            </p>
                          </div>
                          <p className="mt-2 overflow-x-auto whitespace-nowrap text-sm font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100" title={order.order_id}>
                            {order.order_id}
                          </p>
                          {order.order_token && (
                            <p className="mt-1 text-[10px] font-black tracking-wide text-[#176b57] dark:text-emerald-300">
                              Token {order.order_token}
                            </p>
                          )}
                        </div>

                        <div className="mt-4">
                          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Items Collected</p>
                          <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                                  <img
                                    src={item.image_url || "https://placehold.co/100x100?text=Food"}
                                    alt={item.name}
                                    className="h-8 w-8 rounded-md object-cover bg-slate-200 dark:bg-slate-700 shadow-sm"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://placehold.co/100x100?text=Food";
                                    }}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Qty: {item.quantity}</p>
                                  </div>
                                  <p className="shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {formatAmount(item.price * item.quantity, order.payment_currency)}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">No items listed</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-4 sm:grid-cols-3">
                          <button type="button" onClick={() => copyOrderId(order.order_id)} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 sm:text-[11px]">
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                            {copied ? "Copied" : "Copy ID"}
                          </button>
                          <button type="button" onClick={() => printReceipt(order)} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 sm:text-[11px]" title="Print receipt">
                            <Printer className="h-3.5 w-3.5" /> Print Receipt
                          </button>
                          <div className="col-span-2 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-2 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 sm:col-span-1">
                            <Check className="h-3.5 w-3.5" /> Paid
                          </div>
                        </div>

                        <dl className="mt-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <dt className="flex min-w-0 items-center gap-2 font-medium text-slate-500 dark:text-slate-400"><MapPin className="h-3.5 w-3.5 shrink-0" /> Table number</dt>
                            <dd className="whitespace-nowrap text-right font-bold text-slate-900 dark:text-slate-100">Table #{order.table_number}</dd>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <dt className="flex min-w-0 items-center gap-2 font-medium text-slate-500 dark:text-slate-400"><CreditCard className="h-3.5 w-3.5 shrink-0" /> Payment method</dt>
                            <dd className="whitespace-nowrap text-right font-bold text-slate-900 dark:text-slate-100">{order.payment_method || "Cash"}</dd>
                          </div>
                          {order.razorpay_payment_id && (
                            <div className="flex items-start justify-between gap-2">
                              <dt className="min-w-0 font-medium text-slate-500 dark:text-slate-400">Razorpay payment ID</dt>
                              <dd className="max-w-[65%] break-all text-right font-bold text-slate-900 dark:text-slate-100">{order.razorpay_payment_id}</dd>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <dt className="flex min-w-0 items-center gap-2 font-medium text-slate-500 dark:text-slate-400"><Clock3 className="h-3.5 w-3.5 shrink-0" /> Date and time</dt>
                            <dd className="whitespace-nowrap text-right text-[11px] font-bold text-slate-900 dark:text-slate-100 sm:text-xs">{formatCollectedAt(order.paid_at || order.created_at)}</dd>
                          </div>
                        </dl>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
    </AppShell>
  );
}