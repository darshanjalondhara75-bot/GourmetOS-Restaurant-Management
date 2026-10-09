"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/authContext";
import {
  getMyBookings,
  getMyOrders,
  getMyPlanTransactions,
  RestaurantOrder,
  TableBooking,
  PlanTransaction,
} from "@/lib/api";
import { printProfessionalReceipt } from "@/lib/receiptPrinter";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";
import {
  Banknote,
  ChefHat,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  Crown,
  Printer,
  QrCode,
  RefreshCw,
  Receipt,
  Sparkles,
  Table2,
  Utensils,
  ArrowRight,
} from "lucide-react";const steps = ["Pending", "Accepted", "Cooking", "Ready", "Completed"] as const;

type HistoryTab = "all" | "bookings" | "orders" | "plans";

function normalizeStatus(status: RestaurantOrder["status"]) {
  return status === "Preparing" ? "Cooking" : status;
}

function statusMeta(status: RestaurantOrder["status"]) {
  const s = normalizeStatus(status);
  if (s === "Completed") return { label: "Completed", tone: "emerald", icon: CheckCircle2 };
  if (s === "Ready") return { label: "Ready for pickup / service", tone: "sky", icon: Utensils };
  if (s === "Cooking") return { label: "Cooking", tone: "violet", icon: ChefHat };
  if (s === "Accepted") return { label: "Accepted by Chef", tone: "indigo", icon: CheckCircle2 };
  if (s === "Cancelled") return { label: "Cancelled", tone: "rose", icon: Clock3 };
  return { label: "Order received", tone: "amber", icon: Clock3 };
}

function formatDate(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

/** Cashier-panel style professional receipt — prints ONLY the customer's order receipt. */
function printOrderReceipt(order: RestaurantOrder) {
  printProfessionalReceipt(order);
}

function UserOrdersContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const portfolioDemo = searchParams.get("portfolioDemo") === "1";
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [bookings, setBookings] = useState<TableBooking[]>([]);
  const [planTransactions, setPlanTransactions] = useState<PlanTransaction[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HistoryTab>("all");
  const previewReadOnly = portfolioDemo && !authLoading && user?.role !== "user";
  const pageLoading = loading && !previewReadOnly;

  const loadHistory = async () => {
    if (!user || user.role !== "user") {
      setLoading(false);
      return;
    }
    const [ordersResult, bookingsResult, plansResult] = await Promise.allSettled([
      getMyOrders(),
      getMyBookings(),
      getMyPlanTransactions(),
    ]);
    if (ordersResult.status === "fulfilled") setOrders(Array.isArray(ordersResult.value) ? ordersResult.value : []);
    if (bookingsResult.status === "fulfilled") setBookings(Array.isArray(bookingsResult.value) ? bookingsResult.value : []);
    if (plansResult.status === "fulfilled") {
      setPlanTransactions(plansResult.value.transactions || []);
      setCurrentPlan(plansResult.value.current_plan || null);
    }
    setLoading(false);
  };

  useRealtimeUpdates(loadHistory, ["orders", "bookings"]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role === "user") {
      void Promise.resolve().then(loadHistory);
    } else {
      setLoading(false);
    }
  }, [user, authLoading]);

  const activeOrders = useMemo(
    () => orders.filter((o) => !["Completed", "Cancelled"].includes(o.status)),
    [orders]
  );
  const historyOrders = useMemo(
    () => orders.filter((o) => ["Completed", "Cancelled"].includes(o.status)),
    [orders]
  );
  const activeBookings = useMemo(() => bookings.filter((b) => b.status === "Active"), [bookings]);
  const pastBookings = useMemo(() => bookings.filter((b) => b.status !== "Active"), [bookings]);

  const tabs: { id: HistoryTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "all", label: "All Activity", icon: <Sparkles className="w-3.5 h-3.5" />, count: activeBookings.length + activeOrders.length + planTransactions.length },
    { id: "bookings", label: "Table Bookings", icon: <Table2 className="w-3.5 h-3.5" />, count: bookings.length },
    { id: "orders", label: "Orders", icon: <ClipboardList className="w-3.5 h-3.5" />, count: orders.length },
    { id: "plans", label: "Plan Transactions", icon: <Crown className="w-3.5 h-3.5" />, count: planTransactions.length },
  ];

  const renderBooking = (booking: TableBooking) => {
    const statusTone =
      booking.status === "Active"
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        : booking.status === "Completed"
          ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
    return (
      <article key={booking.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <span className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Table2 className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">Table #{booking.table_number}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${statusTone}`}>{booking.status}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-600 dark:text-slate-300">
                {booking.capacity} seats
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Reserved for <span className="font-bold text-slate-700 dark:text-slate-300">{booking.customer_name}</span> · {formatDate(booking.booked_at)}
            </p>
            {booking.order_token && (
              <p className="mt-1.5 inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-[10px] font-black tracking-wide text-emerald-700 dark:text-emerald-300">
                <QrCode className="w-3 h-3 mr-1" /> Token {booking.order_token}
              </p>
            )}
          </div>
          {booking.status === "Active" && (
            <Link
              href={portfolioDemo ? "/customer/menu?portfolioDemo=1" : "/user/table-booking"}
              className="btn-secondary text-xs font-bold py-2.5 px-3 inline-flex items-center gap-1.5 shrink-0"
            >
              Open Session <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </article>
    );
  };

  const renderPlanTx = (tx: PlanTransaction) => (
    <article key={tx.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <span className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
        <Crown className="w-5 h-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-slate-900 dark:text-slate-100">{tx.plan_name} Plan</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[9px] font-black uppercase">{tx.status}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatDate(tx.created_at)}</p>
        {tx.razorpay_payment_id && (
          <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">Razorpay: {tx.razorpay_payment_id}</p>
        )}
      </div>
      <div className="text-left sm:text-right shrink-0">
        <span className="text-base font-black text-indigo-700 dark:text-indigo-400">₹{tx.amount_inr}</span>
        <span className="block text-[10px] text-slate-400">≈ ${tx.amount_usd}</span>
      </div>
    </article>
  );

  const renderOrder = (order: RestaurantOrder) => {
    const normalized = normalizeStatus(order.status);
    const activeIndex = steps.indexOf(normalized as (typeof steps)[number]);
    const meta = statusMeta(order.status);
    const paid = order.payment_status === "Paid";
    const isCancelled = order.status === "Cancelled";
    const isRefunded = order.payment_status === "Refunded";
    const paymentLabel = isCancelled ? (isRefunded ? "Refunded" : "Cancelled") : (paid ? "Paid" : "Payment Pending");
    const paymentStyle = isCancelled
      ? (isRefunded ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600")
      : (paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700");

    return (
      <article key={order.id || order.order_id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{order.order_id}</span>
              <span className={`px-2 py-1 rounded-full text-[10px] font-black ${meta.tone === "emerald" ? "bg-emerald-50 text-emerald-700" :
                  meta.tone === "sky" ? "bg-sky-50 text-sky-700" :
                    meta.tone === "violet" ? "bg-violet-50 text-violet-700" :
                      meta.tone === "indigo" ? "bg-indigo-50 text-indigo-700" :
                        meta.tone === "rose" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                }`}>
                {meta.label}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">Table #{order.table_number}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
            {order.order_token && (
              <p className="mt-1.5 inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-[10px] font-black tracking-wide text-emerald-700 dark:text-emerald-300">
                Token {order.order_token}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className={`px-3 py-2 rounded-xl text-xs font-bold ${paymentStyle}`}>
              <CreditCard className="w-3.5 h-3.5 inline mr-1" />{paymentLabel}
            </div>
            <button
              onClick={() => printOrderReceipt(order)}
              className="btn-secondary text-xs font-bold py-2.5 px-3 inline-flex items-center gap-1.5"
              title="Print customer receipt"
            >
              <Printer className="w-3.5 h-3.5" /> Receipt
            </button>
            <Link href={`/customer/order-status/${order.order_id}`} className="btn-secondary text-xs font-bold py-2.5 px-3 inline-flex items-center gap-1.5">
              Open Tracker <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {normalized !== "Cancelled" && (
          <div className="px-4 sm:px-5 pb-5">
            <div className="grid grid-cols-5 gap-1 mb-4">
              {steps.map((step, index) => {
                const reached = index <= activeIndex;
                const current = index === activeIndex;
                return (
                  <div key={step} className="min-w-0 text-center">
                    <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${reached ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-400"
                      } ${current ? "ring-4 ring-indigo-100 dark:ring-indigo-900/40" : ""}`}>{index + 1}</div>
                    <p className={`text-[9px] sm:text-[10px] font-bold mt-1 ${reached ? "text-slate-800 dark:text-slate-200" : "text-slate-400"}`}>{step}</p>
                  </div>
                );
              })}
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${Math.max(10, ((activeIndex + 1) / steps.length) * 100)}%` }} />
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 dark:border-slate-800 p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={`${item.item_id}-${idx}`} className="flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-black">{item.quantity}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="font-black text-slate-800 dark:text-slate-200">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-sm font-black text-slate-700 dark:text-slate-300 block">Total</span>
              {order.payment_method === "Online" && (
                <span className="text-[10px] text-slate-500 font-medium block">
                  Rate: 1 USD = ₹{(order.payment_exchange_rate || 83).toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-indigo-700 dark:text-indigo-400 block">${order.total_amount.toFixed(2)}</span>
              {order.payment_method === "Online" && (
                <span className="text-[11px] font-bold text-emerald-600 block">
                  {order.payment_status === "Paid"
                    ? `Paid: ₹${(order.paid_amount ?? (order.total_amount * (order.payment_exchange_rate || 83))).toFixed(2)} INR`
                    : `Razorpay: ₹${(order.total_amount * (order.payment_exchange_rate || 83)).toFixed(2)} INR`}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  };

  const isEmpty =
    bookings.length === 0 && orders.length === 0 && planTransactions.length === 0;

  return (
    <AppShell>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-indigo">Customer Panel</span>
            {portfolioDemo && <span className="badge">Portfolio demo</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">Order History</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hello {user?.name || "Customer"}. Track table bookings, orders and plan payments in one place.
          </p>
        </div>
        <button onClick={() => loadHistory()} disabled={pageLoading || previewReadOnly} className="btn-secondary text-xs font-bold py-2.5 px-3 inline-flex items-center justify-center gap-2">
          <RefreshCw className={`w-4 h-4 ${pageLoading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Order history sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-black whitespace-nowrap border transition ${
              activeTab === tab.id
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${activeTab === tab.id ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {pageLoading && isEmpty ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <ClipboardList className="w-8 h-8 text-indigo-500 mx-auto mb-3 animate-pulse" />
          <p className="text-sm font-bold text-slate-500">Loading your activity...</p>
        </div>
      ) : isEmpty && activeTab !== "plans" ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
          <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No activity yet</p>
          <p className="text-xs text-slate-400 mt-1">
            {portfolioDemo ? "This is the customer home page. Bookings and orders appear here." : "Book a table to start your next dining session."}
          </p>
          <Link
            href={portfolioDemo ? "/customer/menu?portfolioDemo=1" : "/user/table-booking"}
            className="btn-primary mt-4 inline-flex items-center gap-2 text-xs font-bold py-2.5 px-4"
          >
            {portfolioDemo ? "Browse Customer Menu" : "Book a Table"} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {(activeTab === "all" || activeTab === "bookings") && (
            <section className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
                <Table2 className="w-4 h-4" /> Table Bookings ({bookings.length})
              </h2>
              {bookings.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                  <Banknote className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No table bookings</p>
                  <p className="text-xs text-slate-400 mt-1">Book a table with Razorpay deposit to see it here.</p>
                </div>
              ) : (
                <>
                  {activeBookings.map(renderBooking)}
                  {pastBookings.map(renderBooking)}
                </>
              )}
            </section>
          )}

          {(activeTab === "all" || activeTab === "orders") && (
            <section className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Orders ({orders.length})
              </h2>
              {activeOrders.length === 0 && historyOrders.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                  <Utensils className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No orders yet</p>
                  <p className="text-xs text-slate-400 mt-1">Place an order from your table QR menu.</p>
                </div>
              ) : (
                <>
                  {activeOrders.map(renderOrder)}
                  {historyOrders.slice(0, 20).map(renderOrder)}
                </>
              )}
            </section>
          )}

          {(activeTab === "all" || activeTab === "plans") && (
            <section className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
                <Crown className="w-4 h-4" /> Plan Transactions ({planTransactions.length})
                {currentPlan && (
                  <span className="ml-1 normal-case tracking-normal text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Active: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  </span>
                )}
              </h2>
              {planTransactions.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                  <Crown className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No plan transactions</p>
                  <p className="text-xs text-slate-400 mt-1">Razorpay membership payments will appear here.</p>
                  <Link
                    href={portfolioDemo ? "/user/plans?portfolioDemo=1" : "/user/plans"}
                    className="btn-primary mt-4 inline-flex items-center gap-2 text-xs font-bold py-2.5 px-4"
                  >
                    View Membership Plans <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                planTransactions.map(renderPlanTx)
              )}
            </section>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex items-start gap-3">
        <Receipt className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Cashier-style receipts</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Tap "Receipt" on any paid order to print a thermal-style receipt with only your items — just like a restaurant cashier panel.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

export default function UserOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-slate-400">Loading your history...</div>}>
      <UserOrdersContent />
    </Suspense>
  );
}
