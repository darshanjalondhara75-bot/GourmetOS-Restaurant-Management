"use client";

import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/authContext";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";
import {
  createTableBooking,
  DiningTable,
  getMyBookings,
  getMyPlanTransactions,
  getPublicTables,
  getTableQrMapping,
  TableBooking,
  TableQrMapping,
} from "@/lib/api";
import { triggerRazorpayPayment } from "@/lib/razorpay";
import {
  getTableTier,
  TABLE_TIERS,
  TIER_ORDER,
  TableTier,
  isTableCoveredByPlan,
  formatPlanName,
} from "@/lib/tiers";
import {
  Armchair,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Clock3,
  Crown,
  Grid3X3,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

const statusStyles: Record<string, string> = {
  Available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Reserved: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Occupied: "bg-amber-50 text-amber-700 border-amber-200",
  Cleaning: "bg-rose-50 text-rose-700 border-rose-200",
};

const normalizeTableNumber = (tableNumber: string) => {
  const digits = tableNumber.replace(/\D/g, "");
  return digits ? digits.replace(/^0+(?=\d)/, "") : tableNumber.trim().toLowerCase();
};

function TableBookingContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const portfolioDemo = searchParams.get("portfolioDemo") === "1";
  const previewReadOnly = portfolioDemo && !authLoading && user?.role !== "user";
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [bookings, setBookings] = useState<TableBooking[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingTable, setBookingTable] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrModal, setQrModal] = useState<TableQrMapping | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [payTable, setPayTable] = useState<DiningTable | null>(null);
  const [payProcessing, setPayProcessing] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const nameInputRef = useRef<HTMLDivElement>(null);

  const activeBooking = useMemo(
    () => bookings.find((b) => b.status === "Active"),
    [bookings]
  );
  const normalizedName = (customerName || (user?.role === "user" ? user.name : "")).trim();

  const loadData = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    const [tableResult, bookingResult, planResult] = await Promise.allSettled([
      getPublicTables(),
      getMyBookings(),
      getMyPlanTransactions(),
    ]);

    if (tableResult.status === "fulfilled") {
      setTables(tableResult.value);
    } else if (!silent) {
      setTables([]);
      setMessage({
        type: "error",
        text:
          tableResult.reason instanceof Error
            ? tableResult.reason.message
            : "Unable to load restaurant tables.",
      });
    }

    if (bookingResult.status === "fulfilled") {
      setBookings(bookingResult.value);
    } else if (!silent) {
      setBookings([]);
      setMessage({
        type: "error",
        text:
          bookingResult.reason instanceof Error
            ? bookingResult.reason.message
            : "Unable to load your booking.",
      });
    }

    if (planResult.status === "fulfilled") {
      const pData = planResult.value;
      const foundPlan =
        pData.current_plan ||
        pData.transactions?.find((t) => t.status === "Success" || t.status === "success")?.plan_id ||
        null;
      setCurrentPlan(foundPlan);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useRealtimeUpdates(() => loadData(true), ["tables", "bookings", "orders", "plans"]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role === "user") {
      void Promise.resolve().then(() => loadData());
    }
  }, [user, authLoading]);

  const handleBook = async (table: DiningTable) => {
    setMessage(null);

    if (normalizedName.length < 2) {
      setMessage({ type: "error", text: "Please enter a name with at least 2 characters." });
      nameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (activeBooking) {
      setMessage({
        type: "error",
        text: `You already have Table #${activeBooking.table_number} reserved. Table reservations cannot be cancelled once booked.`,
      });
      return;
    }

    if (table.status !== "Available") {
      setMessage({
        type: "error",
        text: `Table #${table.table_number} is no longer available. Please choose another table.`,
      });
      await loadData(true);
      return;
    }

    const tierName = getTableTier(table);
    const isCovered = isTableCoveredByPlan(tierName, currentPlan);

    // If active plan covers this table tier (e.g. Silver plan covers Silver tables):
    // Book directly without paying again!
    if (isCovered) {
      setBookingTable(table.table_number);
      try {
        await createTableBooking(table.table_number, normalizedName);
        setMessage({
          type: "success",
          text: `Table #${table.table_number} is booked successfully for ${normalizedName} using your ${formatPlanName(currentPlan)} Plan benefit (₹0 deposit). Tap the QR code to open your menu.`,
        });
        await loadData(true);
      } catch (error) {
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Table booking failed.",
        });
        await loadData(true);
      } finally {
        setBookingTable(null);
      }
      return;
    }

    // Step 1 — Razorpay reservation deposit before booking (for non-covered tables)
    setPayTable(table);
  };

  const handlePayAndBook = async () => {
    const table = payTable;
    if (!table) return;
    setPayProcessing(true);
    const tier = TABLE_TIERS[getTableTier(table)];

    triggerRazorpayPayment({
      amount: tier.depositINR,
      currency: "INR",
      name: "GourmetOS Table Reservation",
      description: `${tier.tier} Table #${table.table_number} reservation deposit (${table.capacity} seats)`,
      customerName: normalizedName,
      customerEmail: user?.email || "guest@gourmetos.com",
      customerPhone: "",
      notes: { table_number: table.table_number, tier: tier.tier },
      onSuccess: async (paidId) => {
        setPaymentId(paidId);
        setPayProcessing(false);
        try {
          await createTableBooking(table.table_number, normalizedName);
          setMessage({
            type: "success",
            text: `Payment successful — Table #${table.table_number} is booked for ${normalizedName}. Tap the QR code to open your one-time menu.`,
          });
          setPayTable(null);
          await loadData(true);
        } catch (error) {
          setMessage({
            type: "error",
            text: error instanceof Error ? error.message : "Table booking failed after payment.",
          });
          await loadData(true);
        }
      },
      onDismiss: () => {
        setPayProcessing(false);
        setPayTable(null);
        setMessage({ type: "error", text: "Payment was cancelled. Your table was not booked." });
      },
    });
  };

  const handleShowQr = async (booking: TableBooking) => {
    setQrLoading(true);
    setMessage(null);
    try {
      const token = booking.session_token;
      if (!token) {
        throw new Error("Your one-time menu token is not ready yet. Refresh and try again.");
      }
      const data = await getTableQrMapping(booking.table_number, token);
      const path = `/customer/menu?tableId=${encodeURIComponent(booking.table_number)}&token=${encodeURIComponent(token)}`;
      const fullTargetUrl = `${window.location.origin}${path}`;
      setQrModal({
        ...data,
        qr_code_url: path,
        full_target_url: fullTargetUrl,
        qr_image_url: `https://quickchart.io/qr?text=${encodeURIComponent(fullTargetUrl)}&size=320&margin=2`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to load the table QR code.",
      });
    } finally {
      setQrLoading(false);
    }
  };

  const availableCount = tables.filter((t) => t.status === "Available").length;
  const reservedCount = tables.filter((t) => t.status === "Reserved").length;
  const occupiedCount = tables.filter((t) => t.status === "Occupied").length;

  return (
    <AppShell>
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-indigo">Customer Panel</span>
              {portfolioDemo && <span className="badge">Portfolio demo</span>}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live table updates
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
              Table Booking
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Enter your name, reserve an available table, then tap the QR code to open your one-time menu.
            </p>
          </div>

          <div className="w-full md:w-80" ref={nameInputRef}>
            <label className="block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              Your Name *
            </label>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={customerName || (user?.role === "user" ? user.name : "")}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="custom-input pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                maxLength={80}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Your name will be shown on the reserved table.
            </p>
          </div>
        </div>
      </div>

      {currentPlan && (
        <div className="rounded-2xl sm:rounded-3xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Active Membership
                </span>
                <span className="rounded-full bg-emerald-200/70 dark:bg-emerald-900/60 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-800">
                  {formatPlanName(currentPlan)} Plan (Active)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {currentPlan.toLowerCase() === "platinum"
                  ? "Your Platinum plan includes all Silver, Gold & Platinum tables with ₹0 deposit. Book directly without paying again!"
                  : currentPlan.toLowerCase() === "gold"
                  ? "Your Gold plan includes all Silver & Gold tables with ₹0 deposit. Book directly without paying again!"
                  : "Your Silver plan includes all Silver tables with ₹0 deposit. Book directly without paying again!"}
              </p>
            </div>
          </div>
          <Link
            href="/user/plans"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline dark:text-emerald-300 self-start sm:self-auto shrink-0"
          >
            Membership Details &rarr;
          </Link>
        </div>
      )}

      {message && (
        <div
          className={`rounded-2xl border p-3 sm:p-3.5 flex items-start gap-3 text-xs sm:text-sm font-semibold ${message.type === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50"
            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50"
            }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm">
          <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-400">Available</div>
          <div className="text-lg sm:text-2xl font-black text-emerald-600 mt-1">{availableCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm">
          <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-400">Reserved</div>
          <div className="text-lg sm:text-2xl font-black text-indigo-600 mt-1">{reservedCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm">
          <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-400">Occupied</div>
          <div className="text-lg sm:text-2xl font-black text-amber-600 mt-1">{occupiedCount}</div>
        </div>
      </div>

      {/* Dining tier experiences: Silver / Gold / Platinum */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">Dining Experiences</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Every table belongs to a tier — Basic, Middle or VIP — with its own experience and services.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" /> Razorpay secured
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
          {TIER_ORDER.map((tierName: TableTier) => {
            const tier = TABLE_TIERS[tierName];
            return (
              <article
                key={tierName}
                className={`rounded-2xl border p-4 sm:p-5 ${tier.accentSoft}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl" aria-hidden>{tier.icon}</span>
                  <div className="min-w-0">
                    <h3 className={`text-sm sm:text-base font-black ${tier.accentText}`}>{tier.tier}</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">{tier.tagline}</p>
                  </div>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-black ${tier.accentText} bg-white/70 dark:bg-black/20`}>
                    {isTableCoveredByPlan(tierName, currentPlan)
                      ? "Covered by Plan (₹0)"
                      : `₹${tier.depositINR} deposit`}
                  </span>
                </div>
                <p className="mt-3 text-[11px] sm:text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {tier.experience}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {tier.services.map((service) => (
                    <li key={service} className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${tier.accentText}`} />
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      {loading && tables.length === 0 && !previewReadOnly ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <Loader2 className="w-7 h-7 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading restaurant tables...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Grid3X3 className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">No restaurant tables available</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
            {portfolioDemo
              ? "This read-only preview shows the customer booking page. Sign in as a customer to reserve a table."
              : "No tables are currently configured. Once Admin adds tables, they will appear here automatically."}
          </p>
          {!portfolioDemo && <button onClick={() => loadData()} className="btn-primary mt-4 px-4 py-2.5 text-xs font-black inline-flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Tables
          </button>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">Restaurant Tables</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Admin table changes sync here automatically.</p>
            </div>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="btn-secondary text-xs font-bold px-3 py-2 inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {tables.map((table) => {
              const available = table.status === "Available";
              const isMyTable = activeBooking
                ? normalizeTableNumber(activeBooking.table_number) === normalizeTableNumber(table.table_number)
                : false;
              const disabled = !available || (!!activeBooking && !isMyTable) || (!!bookingTable && bookingTable !== table.table_number);

              return (
                <article
                  key={table.id}
                  className={`group bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-sm transition-all ${isMyTable
                    ? "border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-100 dark:ring-emerald-900/30"
                    : available
                      ? "border-slate-200 dark:border-slate-800 hover:-translate-y-0.5 hover:shadow-lg"
                      : "border-slate-200/80 dark:border-slate-800/80"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${isMyTable ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"
                        }`}>
                        <Armchair className={`w-4 h-4 sm:w-5 sm:h-5 ${isMyTable ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100">Table #{table.table_number}</h3>
                        <p className="text-[11px] sm:text-xs text-slate-400">{table.capacity} seats</p>
                        <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black ${TABLE_TIERS[getTableTier(table)].accentSoft} ${TABLE_TIERS[getTableTier(table)].accentText}`}>
                          <Crown className="w-2.5 h-2.5" /> {getTableTier(table)}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border text-[9px] sm:text-[10px] font-black whitespace-nowrap ${statusStyles[table.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      {table.status}
                    </span>
                  </div>

                  {isMyTable && activeBooking && (
                    <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide">Your Reservation</span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Reserved for <span className="font-bold">{activeBooking.customer_name}</span>
                      </p>
                      {activeBooking.order_token && (
                        <p className="text-[10px] sm:text-[11px] text-emerald-500 dark:text-emerald-500 mt-1 font-mono">
                          Token: {activeBooking.order_token}
                        </p>
                      )}
                    </div>
                  )}

                  {table.reserved_by_name && !isMyTable && (
                    <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-xs text-indigo-800 dark:text-indigo-300 font-semibold">
                      <UserRound className="w-3.5 h-3.5 inline mr-1" />
                      Reserved for: {table.reserved_by_name}
                    </div>
                  )}

                  {!table.reserved_by_name && table.status === "Occupied" && (
                    <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300 font-semibold">
                      Currently occupied
                    </div>
                  )}

                  {isMyTable && activeBooking && activeBooking.order_placed ? (
                    <div className="mt-3 sm:mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                      Order placed &bull; Dining session in progress. Complete payment at counter to release table.
                    </div>
                  ) : isMyTable && activeBooking ? (
                    <div className="mt-3 sm:mt-4 space-y-2">
                      <button
                        onClick={() => handleShowQr(activeBooking)}
                        disabled={qrLoading}
                        className="w-full btn-primary py-2.5 sm:py-3 text-xs font-black inline-flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {qrLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <QrCode className="w-4 h-4" />
                        )}
                        Open Table Menu QR Code
                      </button>
                      <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 py-1.5 px-2 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Table reservation is confirmed (cannot be cancelled)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 sm:mt-4 space-y-1.5">
                      {available && isTableCoveredByPlan(getTableTier(table), currentPlan) && (
                        <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                          <Sparkles className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>Included with your {formatPlanName(currentPlan)} Plan &bull; &#8377;0 deposit</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleBook(table)}
                        disabled={disabled}
                        className={`w-full py-2.5 text-xs font-black disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 transition rounded-xl ${
                          available && isTableCoveredByPlan(getTableTier(table), currentPlan)
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            : "btn-primary"
                        }`}
                      >
                        {bookingTable === table.table_number ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
                        ) : available && isTableCoveredByPlan(getTableTier(table), currentPlan) ? (
                          <><CheckCircle2 className="w-4 h-4" /> Book this table</>
                        ) : available ? (
                          <><Banknote className="w-4 h-4" /> Pay &#8377;{TABLE_TIERS[getTableTier(table)].depositINR} &amp; Book</>
                        ) : (
                          "Not Available"
                        )}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex items-start gap-3">
        <Clock3 className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Dining session flow</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Book a table → tap QR code → place one order → cashier collects cash or card → table becomes available again.
          </p>
        </div>
      </div>

      {/* Razorpay pre-booking payment modal */}
      {payTable && (
        <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#176b57]">Secure Checkout</p>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-1 truncate">
                  Table #{payTable.table_number} · {getTableTier(payTable)}
                </h3>
              </div>
              <button
                onClick={() => !payProcessing && setPayTable(null)}
                aria-label="Close payment"
                className="h-9 w-9 shrink-0 rounded-xl bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center shadow-sm disabled:opacity-50"
                disabled={payProcessing}
              >
                <X className="w-4 h-4" strokeWidth={2.75} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Experience</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {TABLE_TIERS[getTableTier(payTable)].icon} {getTableTier(payTable)} Dining
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Seats</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{payTable.capacity} guests</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Reserved for</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate ml-3">{normalizedName}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Reservation deposit</span>
                  <span className="font-black text-slate-900 dark:text-slate-100">₹{TABLE_TIERS[getTableTier(payTable)].depositINR}</span>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                <span>
                  Payment happens first via Razorpay. Once payment succeeds, Table #{payTable.table_number} is booked instantly
                  and the deposit is adjusted against your bill.
                </span>
              </div>

              <button
                onClick={handlePayAndBook}
                disabled={payProcessing}
                className="btn-primary mt-5 w-full py-3.5 text-sm font-black inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {payProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing payment...</>
                ) : (
                  <><BadgeCheck className="w-4 h-4" /> Pay ₹{TABLE_TIERS[getTableTier(payTable)].depositINR} with Razorpay</>
                )}
              </button>
              <p className="mt-3 text-center text-[10px] text-slate-400">
                Powered by Razorpay · UPI, Cards, NetBanking & Wallets
              </p>
            </div>
          </div>
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#176b57]">Table Menu</p>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-1 truncate">Table #{qrModal.table_number} QR Code</h3>
              </div>
              <button
                onClick={() => setQrModal(null)}
                aria-label="Close QR code"
                className="h-9 w-9 shrink-0 rounded-xl bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center shadow-sm"
              >
                <X className="w-4 h-4" strokeWidth={2.75} />
              </button>
            </div>

            <div className="p-4 sm:p-6 text-center">
              <div className="mx-auto w-fit rounded-3xl border border-[#d7ece6] bg-[#eef7f4] dark:border-[#38675a] dark:bg-[#234c42]/30 p-3 sm:p-5 shadow-inner">
                <div className="rounded-2xl bg-white p-2.5 sm:p-3 shadow-sm">
                  <img
                    src={qrModal.qr_image_url}
                    alt={`QR code for Table ${qrModal.table_number}`}
                    className="w-48 h-48 sm:w-64 sm:h-64 max-w-full object-contain"
                  />
                </div>
              </div>
              <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-100">Scan to open the one-time customer menu</p>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 break-all px-1">{qrModal.full_target_url}</p>
              <Link
                href={qrModal.qr_code_url}
                target="_blank"
                className="btn-primary mt-5 w-full py-3 text-xs font-black inline-flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" /> Open QR Link
              </Link>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function TableBookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-slate-400">Loading table booking...</div>}>
      <TableBookingContent />
    </Suspense>
  );
}
