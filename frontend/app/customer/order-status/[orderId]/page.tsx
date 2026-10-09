"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  createOnlinePaymentOrder,
  getOrderById,
  verifyOnlinePayment,
} from "@/lib/api";
import type { RazorpayCheckoutResponse, RestaurantOrder } from "@/lib/api";
import { triggerRazorpayOrderPayment } from "@/lib/razorpay";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Printer,
  Receipt,
  ShoppingBag,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { PageWrapper } from "@/components/PageWrapper";
import { useAuth } from "@/lib/authContext";
import { printProfessionalReceipt } from "@/lib/receiptPrinter";

const pendingPaymentKey = (orderId: string) => `gourmetos-pending-payment:${orderId}`;
const paymentErrorKey = (orderId: string) => `gourmetos-payment-error:${orderId}`;

export default function OrderStatusTrackerPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { user } = useAuth();
  const [order, setOrder] = useState<RestaurantOrder | null>(null);
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
      setLoadError(null);
    } catch (error) {
      console.error("Failed to load order tracking details:", error);
      setLoadError(error instanceof Error ? error.message : "Could not load this order.");
    }
  }, [orderId]);

  const retryPendingVerification = useCallback(async (): Promise<boolean> => {
    let payment: RazorpayCheckoutResponse;
    try {
      const savedPayment = sessionStorage.getItem(pendingPaymentKey(orderId));
      if (!savedPayment) {
        setPendingVerification(false);
        return false;
      }
      payment = JSON.parse(savedPayment) as RazorpayCheckoutResponse;
      if (!payment.razorpay_payment_id || !payment.razorpay_order_id || !payment.razorpay_signature) {
        sessionStorage.removeItem(pendingPaymentKey(orderId));
        setPendingVerification(false);
        setPaymentError("The saved payment confirmation was incomplete. Please start a new payment.");
        return false;
      }
    } catch (error) {
      setPendingVerification(false);
      setPaymentError("Could not read the pending payment confirmation. Please try again.");
      return false;
    }

    setPaymentBusy(true);
    setPendingVerification(true);
    try {
      await verifyOnlinePayment(orderId, payment);
      sessionStorage.removeItem(pendingPaymentKey(orderId));
      setPendingVerification(false);
      setPaymentError(null);
      await fetchOrder();
      return true;
    } catch (error) {
      setPaymentError(error instanceof Error
        ? `Payment was submitted, but confirmation is still pending: ${error.message}`
        : "Payment was submitted, but confirmation is still pending. Retry verification before paying again.");
      return false;
    } finally {
      setPaymentBusy(false);
    }
  }, [fetchOrder, orderId]);

  useRealtimeUpdates(fetchOrder, ["orders"]);

  useEffect(() => {
    if (!orderId) return;
    void fetchOrder();
    try {
      const savedError = sessionStorage.getItem(paymentErrorKey(orderId))
        || new URLSearchParams(window.location.search).get("paymentError");
      if (savedError) {
        setPaymentError(savedError);
        sessionStorage.removeItem(paymentErrorKey(orderId));
      }
      if (sessionStorage.getItem(pendingPaymentKey(orderId))) {
        setPendingVerification(true);
        void retryPendingVerification();
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Could not read the saved payment status.");
    }
  }, [fetchOrder, orderId, retryPendingVerification]);

  const startOnlinePayment = async () => {
    if (!order) return;
    setPaymentError(null);
    try {
      if (sessionStorage.getItem(pendingPaymentKey(orderId))) {
        setPendingVerification(true);
        await retryPendingVerification();
        return;
      }

      setPaymentBusy(true);
      const paymentSetup = await createOnlinePaymentOrder(order.order_id);
      if (!paymentSetup.available) {
        setPaymentError(paymentSetup.message);
        setPendingVerification(false);
        return;
      }
      const payment = await triggerRazorpayOrderPayment(
        paymentSetup.order,
        user?.name || order.customer_name,
        user?.email || "",
      );
      if (!payment) {
        setPaymentError("Checkout was closed. Your order is still unpaid; you can retry when ready.");
        return;
      }

      sessionStorage.setItem(pendingPaymentKey(orderId), JSON.stringify(payment));
      setPendingVerification(true);
      await retryPendingVerification();
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Online payment could not be completed.");
      void fetchOrder();
    } finally {
      setPaymentBusy(false);
    }
  };

  const steps = ["Pending", "Accepted", "Cooking", "Ready", "Completed"];
  const normStatus = order?.status === "Preparing" ? "Cooking" : order?.status;
  const trackerStatus =
    order?.status === "Ready" &&
    order.payment_method === "Online" &&
    order.payment_status === "Paid"
      ? "Completed"
      : normStatus;
  const currentStepIndex = trackerStatus ? steps.indexOf(trackerStatus) : 0;
  const onlinePaymentsUnavailable = paymentError?.toLowerCase().includes("not configured") ?? false;
  const rate = order?.payment_exchange_rate || 83;
  const inrAmount = order?.paid_amount ?? (order?.payment_amount_paise ? order.payment_amount_paise / 100 : Math.round((order?.total_amount || 0) * rate * 100) / 100);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-slate-50 px-2 py-4 sm:px-4 sm:py-10">
        <div className="mx-auto w-full max-w-2xl space-y-5">
          <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl sm:p-8">
            <div className="mb-6 text-center">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <Utensils className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Order Status Tracker</h1>
              <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                Order #{order?.order_id || orderId} · Table #{order?.table_number || "..."}
              </p>
            </div>

            {loadError && (
              <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                {loadError}
              </div>
            )}

            {order && (
              <>
                <div className="mb-6 border-y border-slate-100 py-6">
                  <div className="space-y-5">
                    {steps.map((step, index) => {
                      const isDone = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      return (
                        <div key={step} className="flex items-start gap-3 sm:gap-4">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${isDone ? "bg-emerald-500 text-white shadow-md shadow-emerald-200" : "bg-slate-100 text-slate-400"}`}>
                            {isDone ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                          </div>
                          <div className="min-w-0 flex-1 pt-1">
                            <p className={`break-words text-sm font-bold leading-snug ${isCurrent ? "text-amber-600" : isDone ? "text-slate-900" : "text-slate-400"}`}>
                              {step === "Pending" && "Order Received"}
                              {step === "Accepted" && "Order Accepted by Kitchen"}
                              {step === "Cooking" && "Chef is Cooking Your Order"}
                              {step === "Ready" && "Dish Ready! Serving to Table"}
                              {step === "Completed" && "Order Completed"}
                            </p>
                            {isCurrent && (
                              <p className="animate-pulse text-[11px] font-semibold text-amber-600">● Current Phase</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setItemsExpanded((expanded) => !expanded)}
                    aria-expanded={itemsExpanded}
                    className="flex w-full items-center justify-between gap-3 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <ShoppingBag className="h-4 w-4 shrink-0 text-indigo-600" />
                      <span className="truncate text-sm font-black text-slate-900">Order items ({order.items.length})</span>
                    </span>
                    {itemsExpanded ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />}
                  </button>
                  {itemsExpanded && (
                    <div className="divide-y divide-slate-100 px-4">
                      {order.items.map((item, index) => (
                        <article key={`${item.item_id}-${index}`} className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 py-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:gap-y-0">
                          <img
                            src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&auto=format&fit=crop&q=80"}
                            alt={item.name}
                            className="row-span-2 h-12 w-12 rounded-xl border border-slate-200 bg-slate-100 object-cover sm:row-span-1 sm:h-14 sm:w-14"
                          />
                          <div className="min-w-0">
                            <p className="break-words text-sm font-bold text-slate-900">{item.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{item.quantity} × ${item.price.toFixed(2)}</p>
                          </div>
                          <p className="col-start-2 text-left text-xs font-black text-slate-900 sm:col-start-3 sm:text-right sm:text-sm">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </article>
                      ))}
                      <div className="flex justify-between gap-3 py-4 text-sm font-black text-slate-900">
                        <span>Total</span>
                        <span className="text-amber-600">
                          ${order.total_amount.toFixed(2)}
                          {order.payment_method === "Online" && (
                            <span className="ml-1 text-xs font-semibold text-slate-500">
                              (≈ ₹{inrAmount.toFixed(2)} INR)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5" aria-label="Payment receipt">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Receipt className="h-5 w-5 shrink-0 text-indigo-600" />
                      <div>
                        <h2 className="text-sm font-black text-slate-900">Payment receipt</h2>
                        <p className="text-[11px] text-slate-500">Order #{order.order_id}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${order.payment_status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                      {order.payment_status}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-slate-500">Amount</dt>
                      <dd className="mt-0.5 font-black text-slate-900">
                        ${order.total_amount.toFixed(2)}
                        {order.payment_method === "Online" && (
                          <span className="ml-1 text-xs font-semibold text-emerald-600">
                            (₹{inrAmount.toFixed(2)} INR)
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Payment method</dt>
                      <dd className="mt-0.5 font-bold text-slate-900">{order.payment_method || "Pay at the restaurant"}</dd>
                    </div>
                    {order.payment_status === "Paid" && (
                      <>
                        <div>
                          <dt className="font-semibold text-slate-500">Receipt / transaction ID</dt>
                          <dd className="mt-0.5 break-all font-bold text-slate-900">{order.razorpay_payment_id || order.order_id}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-500">Paid at</dt>
                          <dd className="mt-0.5 font-bold text-slate-900">
                            {order.paid_at ? new Date(order.paid_at).toLocaleString() : "Payment confirmed"}
                          </dd>
                        </div>
                      </>
                    )}
                  </dl>
                  {order.payment_status === "Paid" && (
                    <button
                      type="button"
                      onClick={() => printProfessionalReceipt(order)}
                      className="btn-secondary mt-4 w-full justify-center gap-2 py-2.5 text-xs font-bold transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 sm:w-auto"
                      title="Print official payment receipt"
                    >
                      <Printer className="h-4 w-4 text-emerald-600" /> Print receipt
                    </button>
                  )}
                </section>

                {order.payment_status !== "Paid" && order.payment_method === "Online" && (
                  <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-live="polite">
                    <div className="flex items-start gap-3">
                      <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-black text-amber-950">
                          {onlinePaymentsUnavailable
                            ? "Online payments are unavailable"
                            : pendingVerification
                              ? "Payment confirmation pending"
                              : "Online payment not completed"}
                        </h2>
                        <p className="mt-1 text-xs leading-relaxed text-amber-900">
                          {onlinePaymentsUnavailable
                            ? "Online payments are not set up right now. Your order is with the kitchen; please pay the cashier at the restaurant."
                            : "Your order is safely with the kitchen. Payment is separate from order progress and will stay unpaid until Razorpay confirms it."}
                        </p>
                        {paymentError && <p role="alert" className="mt-2 break-words text-xs font-semibold text-rose-700">{paymentError}</p>}
                        <button
                          type="button"
                          onClick={startOnlinePayment}
                          disabled={paymentBusy || order.status === "Cancelled"}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-xs font-black text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {paymentBusy
                            ? <><Clock className="h-4 w-4 animate-spin" /> Confirming payment…</>
                            : pendingVerification
                              ? "Retry payment verification"
                              : onlinePaymentsUnavailable
                                ? "Try online payment again"
                                : <>Pay ₹{inrAmount.toFixed(2)} online via Razorpay</>}
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}

            <Link href="/customer/menu" className="btn-secondary mt-5 w-full justify-center py-3 text-xs font-bold">
              <ArrowLeft className="h-4 w-4" /> Order More Items
            </Link>
          </section>
        </div>
      </div>
    </PageWrapper>
  );
}
