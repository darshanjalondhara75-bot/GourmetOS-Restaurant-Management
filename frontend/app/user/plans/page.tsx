"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/authContext";
import {
  getPlans,
  getMyPlanTransactions,
  subscribeToPlan,
  MembershipPlan,
  PlanTransaction,
} from "@/lib/api";
import { triggerRazorpayPayment } from "@/lib/razorpay";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Crown,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { TABLE_TIERS, TIER_ORDER } from "@/lib/tiers";

const tierIcon: Record<string, React.ReactNode> = {
  Silver: <Sparkles className="w-4 h-4" />,
  Gold: <BadgeCheck className="w-4 h-4" />,
  Platinum: <Crown className="w-4 h-4" />,
};

function formatDate(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function UserPlansContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const portfolioDemo = searchParams.get("portfolioDemo") === "1";
  const previewReadOnly = portfolioDemo && !authLoading && user?.role !== "user";

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [transactions, setTransactions] = useState<PlanTransaction[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const loadData = async (silent = false) => {
    if (!user || user.role !== "user") {
      setLoading(false);
      return;
    }
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [planList, myPlans] = await Promise.all([getPlans(), getMyPlanTransactions()]);
      setPlans(planList);
      setTransactions(myPlans.transactions);
      setCurrentPlan(myPlans.current_plan);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to load membership plans.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (user?.role === "user") void Promise.resolve().then(() => loadData());
    else setLoading(false);
  }, [user, authLoading]);

  // Keep the active plan and transaction history in sync in real time
  // (SSE events, 30s poll, and refresh on focus/visibility change).
  useRealtimeUpdates(() => loadData(true), ["plans"]);

  const handleSubscribe = (plan: MembershipPlan) => {
    if (!user) {
      setMessage({ type: "error", text: "Please sign in to subscribe to a plan." });
      return;
    }
    // Already-active plan — do not open Razorpay again.
    if (currentPlan && currentPlan.trim().toLowerCase() === plan.id.trim().toLowerCase()) {
      setMessage({
        type: "info",
        text: `You are already subscribed to the ${plan.name} Plan. No payment needed — choose a different plan to change your membership.`,
      });
      return;
    }
    setMessage(null);
    setSubscribingId(plan.id);
    triggerRazorpayPayment({
      amount: plan.price_inr,
      currency: "INR",
      name: "GourmetOS Membership",
      description: `${plan.name} Plan — ${plan.period === "month" ? "monthly" : ""} subscription`,
      customerName: user.name || "Gourmet Guest",
      customerEmail: user.email || "guest@gourmetos.com",
      customerPhone: "",
      notes: { plan_id: plan.id, plan_name: plan.name },
      onSuccess: async (paymentId) => {
        try {
          const result = await subscribeToPlan(plan.id, paymentId);
          setMessage({ type: "success", text: result.message });
          await loadData(true);
        } catch (error) {
          setMessage({
            type: "error",
            text: error instanceof Error ? error.message : "Subscription could not be completed.",
          });
        } finally {
          setSubscribingId(null);
        }
      },
      onDismiss: () => {
        setSubscribingId(null);
        setMessage({ type: "error", text: "Payment was cancelled. Your plan was not changed." });
      },
    });
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-indigo">Customer Panel</span>
              {portfolioDemo && <span className="badge">Portfolio demo</span>}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">
              Membership Plans
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Choose a dining membership — Basic, Middle or VIP — and pay securely with Razorpay.
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="btn-secondary text-xs font-bold py-2.5 px-4 inline-flex items-center justify-center gap-2 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {currentPlan && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <BadgeCheck className="w-4 h-4 shrink-0" />
            Active membership: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
          </div>
        )}
      </div>

      {message && (
        <div
          className={`rounded-2xl border p-3.5 flex items-start gap-3 text-xs sm:text-sm font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50"
              : message.type === "info"
              ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900/50"
              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          ) : message.type === "info" ? (
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Plan cards */}
      {loading && plans.length === 0 && !previewReadOnly ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <Loader2 className="w-7 h-7 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading membership plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center shadow-sm">
          <Crown className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No membership plans available</p>
          <p className="text-xs text-slate-400 mt-1">Plans are loaded automatically from the backend.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {TIER_ORDER.map((tierName) => {
            const plan = plans.find((p) => p.id === tierName) || plans.find((p) => p.tier === tierName);
            const tier = TABLE_TIERS[tierName];
            const isActive = currentPlan === (plan?.id ?? tierName);
            const isSubscribing = subscribingId === (plan?.id ?? tierName);
            if (!plan) return null;
            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-3xl border p-5 sm:p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                  isActive
                    ? "border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-100 dark:ring-emerald-900/40 bg-white dark:bg-slate-900"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                }`}
              >
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white ${
                      tierName === "Platinum" ? "bg-amber-500" : tierName === "Gold" ? "bg-violet-600" : "bg-sky-600"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${tier.accentSoft} ${tier.accentText}`}
                  >
                    {tierIcon[tierName]}
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">{plan.name} Plan</h2>
                    <p className="text-[11px] text-slate-400">{plan.tagline}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-end gap-1 flex-wrap">
                  <span className="text-3xl font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">₹{plan.price_inr}</span>
                  <span className="text-xs font-bold text-slate-400 mb-1.5 whitespace-nowrap">/ {plan.period}</span>
                  <span className="ml-auto text-[11px] font-semibold text-slate-400 mb-1.5 whitespace-nowrap">≈ ${plan.price_usd}</span>
                </div>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isSubscribing || previewReadOnly}
                  className={`mt-6 w-full py-3 rounded-xl text-xs font-black inline-flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "btn-primary"
                  }`}
                >
                  {isSubscribing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : isActive ? (
                    <><BadgeCheck className="w-4 h-4" /> Current Plan</>
                  ) : (
                    <><Crown className="w-4 h-4" /> Subscribe with Razorpay</>
                  )}
                </button>
                <p className="mt-2 text-center text-[10px] text-slate-400">
                  Secure payment via Razorpay · UPI, Cards & NetBanking
                </p>
              </article>
            );
          })}
        </div>
      )}

      {/* Plan transaction history */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">Plan Transactions</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Every Razorpay subscription payment you have made.</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {transactions.length} record{transactions.length === 1 ? "" : "s"}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-10 text-center">
            <Clock3 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No plan transactions yet</p>
            <p className="text-xs text-slate-400 mt-1">Subscribe to a plan above and the payment will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <span className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  {tierIcon[tx.plan_name] || tierIcon.Middle}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">{tx.plan_name} Plan</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[9px] font-black uppercase">
                      {tx.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(tx.created_at)}</p>
                  {tx.razorpay_payment_id && (
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">Razorpay: {tx.razorpay_payment_id}</p>
                  )}
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-base font-black text-indigo-700 dark:text-indigo-400 whitespace-nowrap">₹{tx.amount_inr}</span>
                  <span className="block text-[10px] text-slate-400 whitespace-nowrap">≈ ${tx.amount_usd}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link
        href={portfolioDemo ? "/user/table-booking?portfolioDemo=1" : "/user/table-booking"}
        className="btn-secondary w-full py-3.5 text-xs font-black inline-flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" /> Continue to Table Booking
      </Link>
    </AppShell>
  );
}

export default function UserPlansPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-slate-400">Loading membership plans...</div>}>
      <UserPlansContent />
    </Suspense>
  );
}
