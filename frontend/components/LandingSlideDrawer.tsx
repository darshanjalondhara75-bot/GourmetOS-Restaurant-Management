"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  QrCode,
  CheckCircle2,
  ChefHat,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  Activity,
  Utensils,
  Plus,
  Minus,
  ShoppingCart,
  Send,
  Eye,
  Radio,
  ChevronRight,
  Search,
  Lock,
  Mail,
  User,
  UserCheck,
  ShieldCheck,
  Check,
} from "lucide-react";
import { SnakeConfig, SnakeTheme } from "./SnakeCanvas";
import { BRAND_NAME } from "@/lib/branding";
import { CULINARY_MENU } from "@/lib/menuData";
import { triggerRazorpayPayment, RAZORPAY_TEST_KEY } from "@/lib/razorpay";

export type DrawerFunction =
  | "table-booking"
  | "role-portals"
  | "qr-menu"
  | "system-stream"
  | "snake-studio"
  | "culinary-menu"
  | "auth-portal"
  | "plan-checkout"
  | null;

export interface PlanData {
  id: string;
  name: string;
  priceUSD: number;
  priceINR: number;
  period: string;
  isTrial: boolean;
  desc: string;
  features: string[];
}

interface LandingSlideDrawerProps {
  activeFunction: DrawerFunction;
  onClose: () => void;
  setActiveFunction: (fn: DrawerFunction) => void;
  snakeConfig: SnakeConfig;
  setSnakeConfig: React.Dispatch<React.SetStateAction<SnakeConfig>>;
  selectedPlan: PlanData | null;
  onPlanSubscribed?: (planId: string) => void;
}

export function LandingSlideDrawer({
  activeFunction,
  onClose,
  setActiveFunction,
  snakeConfig,
  setSnakeConfig,
  selectedPlan,
  onPlanSubscribed,
}: LandingSlideDrawerProps) {
  const router = useRouter();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const root = document.documentElement;
    if (activeFunction) {
      window.addEventListener("keydown", handleKeyDown);
      root.classList.add("scroll-lock");
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      root.classList.remove("scroll-lock");
      document.body.style.removeProperty("overflow");
    };
  }, [activeFunction, onClose]);

  // ==========================================
  // 1. Table Booking State with Razorpay Payment
  // ==========================================
  const [selectedTable, setSelectedTable] = useState("T-03");
  const [guestName, setGuestName] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [bookingTime, setBookingTime] = useState("19:30");
  const [isBooked, setIsBooked] = useState(false);
  const [bookingToken, setBookingToken] = useState("");
  const [slotPaymentId, setSlotPaymentId] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleSlotBookingWithPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setIsProcessingPayment(true);
    const depositAmountINR = 499; // Table slot reservation deposit

    await triggerRazorpayPayment({
      amount: depositAmountINR,
      currency: "INR",
      name: `${BRAND_NAME} Table Reservation`,
      description: `Slot Deposit for Table ${selectedTable} (${partySize} Guests at ${bookingTime})`,
      customerName: guestName,
      customerEmail: "guest@gourmetos.com",
      onSuccess: (paymentId) => {
        setIsProcessingPayment(false);
        setSlotPaymentId(paymentId);
        const token = "gourmet_" + Math.random().toString(36).substring(2, 9);
        setBookingToken(token);
        setIsBooked(true);
      },
      onDismiss: () => {
        setIsProcessingPayment(false);
      },
    });
  };

  const resetBooking = () => {
    setIsBooked(false);
    setGuestName("");
    setSlotPaymentId("");
  };

  // ==========================================
  // 2. Culinary Menu & Cart State
  // ==========================================
  const [activeMenuCategory, setActiveMenuCategory] = useState<string>("all");
  const [menuSearch, setMenuSearch] = useState("");
  const [cart, setCart] = useState<{ [id: string]: number }>({
    item_1: 1,
    item_3: 1,
  });
  const [orderTransmitted, setOrderTransmitted] = useState(false);

  const filteredMenuItems = CULINARY_MENU.filter((item) => {
    const matchesCategory =
      activeMenuCategory === "all" || item.category === activeMenuCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.desc.toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const updateCart = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const cartTotal = Object.entries(cart).reduce((sum, [id, count]) => {
    const item = CULINARY_MENU.find((m) => m.id === id);
    return sum + (item ? item.price * count : 0);
  }, 0);

  const handleTransmitOrder = () => {
    setOrderTransmitted(true);
    setTimeout(() => {
      setOrderTransmitted(false);
    }, 4000);
  };

  // ==========================================
  // 3. Auth Slide State (Login & Signup)
  // ==========================================
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRole, setAuthRole] = useState("chef");
  const [authSuccessMsg, setAuthSuccessMsg] = useState("");

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSuccessMsg(
      authMode === "login"
        ? `Logged in successfully as ${authUsername || "Guest"}! Redirecting...`
        : `Account created for ${authUsername || "User"}! You can now sign in.`
    );
    setTimeout(() => {
      if (authRole === "chef") router.push("/chef");
      else if (authRole === "cashier") router.push("/cashier");
      else if (authRole === "admin") router.push("/admin");
      else router.push("/customer");
    }, 1200);
  };

  // ==========================================
  // 4. Plan Checkout State with Razorpay
  // ==========================================
  const [planPaymentProcessing, setPlanPaymentProcessing] = useState(false);
  const [planPaidSuccess, setPlanPaidSuccess] = useState(false);
  const [planPaymentId, setPlanPaymentId] = useState("");

  const handlePlanPayment = async () => {
    if (!selectedPlan) return;
    setPlanPaymentProcessing(true);

    const amount = selectedPlan.isTrial ? 1 : selectedPlan.priceINR;

    await triggerRazorpayPayment({
      amount: amount,
      currency: "INR",
      name: `${BRAND_NAME} ${selectedPlan.name}`,
      description: selectedPlan.isTrial
        ? `14-Day Free Trial Activation Verification (₹1 Test Auth)`
        : `Subscription Plan: ${selectedPlan.name} (${selectedPlan.period})`,
      customerName: "Restaurant Operator",
      customerEmail: "admin@gourmetos.com",
      onSuccess: (payId) => {
        setPlanPaymentProcessing(false);
        setPlanPaymentId(payId);
        setPlanPaidSuccess(true);
        if (onPlanSubscribed) onPlanSubscribed(selectedPlan.id);
      },
      onDismiss: () => {
        setPlanPaymentProcessing(false);
      },
    });
  };

  // ==========================================
  // 5. Real-time Event Stream Simulation State
  // ==========================================
  const [logs, setLogs] = useState<
    Array<{ id: number; time: string; type: string; message: string; color: string }>
  >([
    {
      id: 1,
      time: "10:24:12",
      type: "SSE_CONNECT",
      message: "Client authenticated to Live Kitchen Event Broker (Channel: KDS_MAIN)",
      color: "text-emerald-400",
    },
    {
      id: 2,
      time: "10:24:19",
      type: "TABLE_RESERVED",
      message: "Table T-03 occupancy updated to 'Reserved' (Guest: Alexander M.)",
      color: "text-amber-400",
    },
    {
      id: 3,
      time: "10:24:25",
      type: "ORDER_DISPATCH",
      message: "Ticket #2089 (Wagyu Ribeye x1, Truffle Cavatelli x2) dispatched to Chef line",
      color: "text-sky-400",
    },
  ]);

  useEffect(() => {
    if (activeFunction !== "system-stream") return;
    const interval = setInterval(() => {
      const events = [
        {
          type: "ORDER_ITEM_DONE",
          message: "Station 1 plated: Chilean Seabass for Table T-02",
          color: "text-sky-300",
        },
        {
          type: "QR_TOKEN_VERIFY",
          message: "Session token consumed for Table T-05 QR ordering",
          color: "text-amber-300",
        },
        {
          type: "SYNC_HEARTBEAT",
          message: "SSE broker ping broadcast (all 4 listeners active, 0 drops)",
          color: "text-emerald-400",
        },
      ];
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];

      setLogs((prev) => [
        {
          id: Date.now(),
          time: timeStr,
          type: randomEvent.type,
          message: randomEvent.message,
          color: randomEvent.color,
        },
        ...prev.slice(0, 18),
      ]);
    }, 3200);

    return () => clearInterval(interval);
  }, [activeFunction]);

  if (!activeFunction) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end animate-fadeIn"
      style={{ animationDuration: "200ms" }}
    >
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity cursor-pointer"
        aria-label="Close Slide Panel"
      />

      {/* Sliding Sheet Panel */}
      <div className="relative z-10 w-full max-w-xl md:max-w-2xl bg-white dark:bg-[#0c1424] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out translate-x-0 overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {activeFunction === "table-booking" && (
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Calendar className="w-5 h-5" />
              </div>
            )}
            {activeFunction === "culinary-menu" && (
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Utensils className="w-5 h-5" />
              </div>
            )}
            {activeFunction === "auth-portal" && (
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
            )}
            {activeFunction === "plan-checkout" && (
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
            )}
            {activeFunction === "role-portals" && (
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
            )}
            {activeFunction === "qr-menu" && (
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <QrCode className="w-5 h-5" />
              </div>
            )}
            {activeFunction === "system-stream" && (
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <Activity className="w-5 h-5" />
              </div>
            )}
            {activeFunction === "snake-studio" && (
              <div className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-500/30">
                <Eye className="w-5 h-5 animate-pulse" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {activeFunction === "table-booking" && "Real-Time Table Booking & Slot Deposit"}
                  {activeFunction === "culinary-menu" && "Gourmet Culinary Menu & Ordering"}
                  {activeFunction === "auth-portal" && "Access Portals: Sign In & Sign Up"}
                  {activeFunction === "plan-checkout" && "Plan Subscription & Razorpay Checkout"}
                  {activeFunction === "role-portals" && "Live Operations Portals & Quick Access"}
                  {activeFunction === "qr-menu" && "Contactless QR Dining Experience"}
                  {activeFunction === "system-stream" && "Live SSE Event Stream & Pulse"}
                  {activeFunction === "snake-studio" && "Cyber Viper Serpent Customizer"}
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                  Slide Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeFunction === "table-booking" &&
                  "Lock your table slot securely with Razorpay test mode deposit."}
                {activeFunction === "culinary-menu" &&
                  "Browse dishes with images, select quantities, and stream orders live."}
                {activeFunction === "auth-portal" &&
                  "Quick login or register for Chef, Cashier, User, or Admin."}
                {activeFunction === "plan-checkout" &&
                  "Activate trial or subscribe to plans using Razorpay test mode."}
                {activeFunction === "role-portals" &&
                  "Switch between Chef KDS, Cashier POS, Customer Menu, and Admin."}
                {activeFunction === "qr-menu" &&
                  "Simulate customer mobile ordering guarded by session tokens."}
                {activeFunction === "system-stream" &&
                  "Zero-latency Server-Sent Events architecture monitoring in real-time."}
                {activeFunction === "snake-studio" &&
                  "Tune the sinuous animation, red eye glow intensity, and luxury scale theme."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Drawer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ======================================================== */}
          {/* PANEL 1: TABLE BOOKING & SLOT PAYMENT (RAZORPAY)         */}
          {/* ======================================================== */}
          {activeFunction === "table-booking" && (
            <div className="space-y-6">
              {!isBooked ? (
                <form onSubmit={handleSlotBookingWithPayment} className="space-y-5">
                  {/* Interactive Floor Plan Selector */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Select Table (Real-Time Floor Map)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: "T-01", name: "Patio Terrace", cap: "2 Guests", status: "Occupied" },
                        { id: "T-02", name: "Window View", cap: "4 Guests", status: "Occupied" },
                        { id: "T-03", name: "VIP Booth", cap: "6 Guests", status: "Available" },
                        { id: "T-04", name: "Chef Table", cap: "4 Guests", status: "Available" },
                        { id: "T-05", name: "Main Salon", cap: "2 Guests", status: "Available" },
                        { id: "T-06", name: "Mezzanine", cap: "8 Guests", status: "Available" },
                        { id: "T-07", name: "Wine Vault", cap: "4 Guests", status: "Reserved" },
                        { id: "T-08", name: "Garden Corner", cap: "2 Guests", status: "Available" },
                      ].map((tbl) => {
                        const isSelected = selectedTable === tbl.id;
                        const isOccupied = tbl.status === "Occupied";
                        return (
                          <button
                            key={tbl.id}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => setSelectedTable(tbl.id)}
                            className={`p-3 rounded-xl border text-left transition-all relative ${isOccupied
                                ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                : isSelected
                                  ? "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30"
                                  : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 cursor-pointer"
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {tbl.id}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tbl.status === "Available"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : tbl.status === "Reserved"
                                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  }`}
                              >
                                {tbl.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
                              {tbl.name}
                            </div>
                            <div className="text-[11px] text-slate-400">{tbl.cap}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer Information Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Guest Name
                      </label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Lord Sterling"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Party Size
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 4, 6, 8].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setPartySize(size)}
                            className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${partySize === size
                                ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                              }`}
                          >
                            {size}p
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Reservation Slot Time
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {["18:00", "19:30", "20:45", "22:00"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setBookingTime(t)}
                          className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${bookingTime === t
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow"
                              : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                            }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slot Deposit & Razorpay Notice */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <CreditCard className="w-4 h-4" />
                        <span>Slot Booking Deposit (Razorpay Test Mode)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Secures table slot. Refunded or adjusted towards final dining bill.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-base text-slate-900 dark:text-white">
                        ₹499
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Instant Lock
                      </span>
                    </div>
                  </div>

                  {/* Submit Booking with Razorpay Payment */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!guestName.trim() || isProcessingPayment}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {isProcessingPayment
                          ? "Opening Razorpay Gateway..."
                          : "Pay ₹499 & Lock Table Slot (Razorpay)"}
                      </span>
                    </button>
                    <p className="text-[11px] text-center text-slate-400 mt-2 font-mono">
                      Test Mode Key: {RAZORPAY_TEST_KEY.substring(0, 14)}...
                    </p>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 text-center animate-scaleIn">
                  <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-inner">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Table {selectedTable} Locked &amp; Paid Successfully!
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Guest: <span className="font-semibold text-slate-900 dark:text-white">{guestName}</span> • Party of {partySize} at {bookingTime}
                    </p>
                    {slotPaymentId && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Payment Verified: {slotPaymentId}</span>
                      </div>
                    )}
                  </div>

                  {/* Live Generated QR Code Card */}
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto shadow-xl">
                    <div className="w-48 h-48 mx-auto bg-white p-3 rounded-xl border border-slate-200 shadow flex flex-col items-center justify-center">
                      <div className="w-full h-full border-4 border-slate-900 rounded-lg p-2 flex flex-col justify-between">
                        <div className="flex justify-between">
                          <div className="w-9 h-9 border-4 border-slate-900 rounded-sm flex items-center justify-center">
                            <div className="w-4 h-4 bg-slate-900" />
                          </div>
                          <div className="w-9 h-9 border-4 border-slate-900 rounded-sm flex items-center justify-center">
                            <div className="w-4 h-4 bg-slate-900" />
                          </div>
                        </div>
                        <div className="flex justify-center items-center py-2">
                          <span className="text-[10px] font-mono font-bold text-slate-900">
                            {selectedTable}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <div className="w-9 h-9 border-4 border-slate-900 rounded-sm flex items-center justify-center">
                            <div className="w-4 h-4 bg-slate-900" />
                          </div>
                          <div className="w-6 h-6 border-2 border-dashed border-emerald-600 rounded flex items-center justify-center">
                            <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1">
                      <div className="text-xs font-mono font-semibold text-slate-500">
                        Dining Token:
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 py-1 px-2 rounded-lg border border-emerald-500/20 truncate">
                        {bookingToken}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Slide directly into Customer Menu! */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={resetBooking}
                      type="button"
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl font-semibold text-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Book Another Table
                    </button>
                    {/* Enter Customer Menu WITH SLIDE EFFECT! */}
                    <button
                      onClick={() => setActiveFunction("culinary-menu")}
                      type="button"
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Utensils className="w-4 h-4" />
                      <span>Enter Customer Menu (Slide)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PANEL 2: GOURMET CULINARY MENU WITH IMAGES               */}
          {/* ======================================================== */}
          {activeFunction === "culinary-menu" && (
            <div className="space-y-6">
              {/* Top Search & Category Pills */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Search dishes (e.g. Wagyu, Truffle, Bass)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: "all", label: "All Items" },
                    { id: "specials", label: "Chef Specials" },
                    { id: "mains", label: "Steaks & Mains" },
                    { id: "starters", label: "Starters" },
                    { id: "desserts", label: "Desserts" },
                    { id: "drinks", label: "Beverages" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveMenuCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeMenuCategory === cat.id
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Cards with Images */}
              <div className="space-y-3">
                {filteredMenuItems.map((item) => {
                  const qty = cart[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col sm:flex-row items-center gap-4 hover:border-emerald-500/40 transition-all"
                    >
                      {/* Dish Image */}
                      <div className="relative w-full sm:w-28 h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {item.badge && (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-950/80 text-amber-400 backdrop-blur-sm border border-amber-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {item.name}
                          </h4>
                          <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400 shrink-0">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                        {item.calories && (
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            {item.calories}
                          </div>
                        )}

                        {/* Quantity Stepper */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <span className="text-[11px] font-semibold text-slate-500">
                            Select Portion:
                          </span>
                          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
                            <button
                              type="button"
                              onClick={() => updateCart(item.id, -1)}
                              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCart(item.id, 1)}
                              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cart Summary & Live Order Broadcast */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Current Dining Cart
                    </span>
                  </div>
                  <span className="font-mono font-extrabold text-base text-slate-900 dark:text-white">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleTransmitOrder}
                  disabled={cartTotal === 0 || orderTransmitted}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${orderTransmitted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90 shadow-lg"
                    }`}
                >
                  {orderTransmitted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 animate-bounce" />
                      <span>Order Streamed to Kitchen Station!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transmit Order to Kitchen KDS (SSE)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PANEL 3: AUTH PORTAL (SIGN IN & SIGN UP)                 */}
          {/* ======================================================== */}
          {activeFunction === "auth-portal" && (
            <div className="space-y-6">
              {/* Tab Switcher */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${authMode === "login"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  Sign In (Login)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${authMode === "signup"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  Create Account (Sign Up)
                </button>
              </div>

              {authSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{authSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="operator@restaurant.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="e.g. chef_ramsay"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Select Operating Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "chef", label: "Chef (KDS)", icon: ChefHat },
                      { id: "cashier", label: "Cashier (POS)", icon: CreditCard },
                      { id: "customer", label: "User", icon: Utensils },
                      { id: "admin", label: "Admin Operations", icon: ShieldAlert },
                    ].map((role) => {
                      const Icon = role.icon;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setAuthRole(role.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-bold transition cursor-pointer ${authRole === role.id
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500"
                              : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{role.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-bold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {authMode === "login" ? "Sign In & Open Station" : "Complete Registration"}
                    </span>
                  </button>
                </div>
              </form>

              {/* Direct Link to Standalone Pages */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Prefer dedicated page?</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push("/login")}
                    className="font-bold text-amber-500 hover:underline cursor-pointer"
                  >
                    /login page
                  </button>
                  <span className="text-slate-400">•</span>
                  <button
                    onClick={() => router.push("/register")}
                    className="font-bold text-emerald-500 hover:underline cursor-pointer"
                  >
                    /register page
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PANEL 4: PLAN CHECKOUT WITH RAZORPAY TEST KEY            */}
          {/* ======================================================== */}
          {activeFunction === "plan-checkout" && (
            <div className="space-y-6">
              {selectedPlan ? (
                !planPaidSuccess ? (
                  <div className="space-y-5">
                    {/* Selected Plan Details Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-slate-900/5 border border-amber-500/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          {selectedPlan.isTrial ? "14-Day Free Trial" : "Selected Subscription"}
                        </span>
                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                            ₹{selectedPlan.priceINR.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            (${selectedPlan.priceUSD} USD / {selectedPlan.period})
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {selectedPlan.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {selectedPlan.desc}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                        {selectedPlan.features.map((feat) => (
                          <div
                            key={feat}
                            className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Razorpay Gateway Information */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Payment Engine</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Razorpay Test Gateway</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500">Merchant API Key:</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                          {RAZORPAY_TEST_KEY}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Payable Amount:</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {selectedPlan.isTrial ? "₹1.00 (Auth Verification)" : `₹${selectedPlan.priceINR}.00`}
                        </span>
                      </div>
                    </div>

                    {/* Pay Button */}
                    <button
                      onClick={handlePlanPayment}
                      disabled={planPaymentProcessing}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 text-white shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {planPaymentProcessing
                          ? "Loading Razorpay Gateway..."
                          : selectedPlan.isTrial
                            ? "Activate 14-Day Free Trial (Razorpay)"
                            : `Pay ₹${selectedPlan.priceINR} via Razorpay Test Mode`}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 text-center animate-scaleIn">
                    <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-inner">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div>
                      <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {selectedPlan.isTrial
                          ? "14-Day Trial Activated Successfully!"
                          : `${selectedPlan.name} Subscribed Successfully!`}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Your plan privileges have been granted and active in real-time.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1.5 max-w-sm mx-auto text-left">
                      <div className="flex justify-between text-slate-500">
                        <span>Transaction ID:</span>
                        <span className="text-emerald-500 font-bold">{planPaymentId}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Plan Tier:</span>
                        <span className="text-slate-900 dark:text-white">{selectedPlan.name}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Status:</span>
                        <span className="text-emerald-500 font-bold">Active &amp; Verified</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition cursor-pointer"
                      >
                        Return to Dashboard
                      </button>
                      <button
                        onClick={() => router.push("/admin")}
                        className="flex-1 py-3 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Open Admin Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-10 text-slate-500">
                  Please choose a plan to proceed with Razorpay checkout.
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PANEL 5: ROLE PORTALS                                    */}
          {/* ======================================================== */}
          {activeFunction === "role-portals" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => router.push("/chef")}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Kitchen KDS
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors flex items-center gap-1.5">
                    <span>Chef Line Display</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Live tickets streamed via SSE. Station routing, cook timers, and instant plating
                    callbacks.
                  </p>
                </div>

                <div
                  onClick={() => router.push("/cashier")}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Point of Sale
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                    <span>Cashier POS & Billing</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    One-tap receipt settle, invoice splitting, and automatic table occupancy release.
                  </p>
                </div>

                <div
                  onClick={() => setActiveFunction("culinary-menu")}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-rose-500/50 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                      Diner Experience
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors flex items-center gap-1.5">
                    <span>Customer QR Menu (Slide)</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Contactless ordering guarded by server-side dining sessions & atomic tokens.
                  </p>
                </div>

                <div
                  onClick={() => router.push("/admin")}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-sky-500/50 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 group-hover:scale-110 transition-transform">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full">
                      Control Hub
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors flex items-center gap-1.5">
                    <span>Admin Command Center</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Floor layout manager, live turnover telemetry, inventory stock, staff access control.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                    Need Direct Credentials Login?
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sign in with username/password or create a new account in slide mode.
                  </p>
                </div>
                <button
                  onClick={() => setActiveFunction("auth-portal")}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition cursor-pointer"
                >
                  Open Auth (Slide)
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PANEL 6: SYSTEM SSE STREAM                               */}
          {/* ======================================================== */}
          {activeFunction === "system-stream" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    SSE Health
                  </div>
                  <div className="text-base font-extrabold text-emerald-500 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Connected</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Latency
                  </div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                    38 ms
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Listeners
                  </div>
                  <div className="text-base font-extrabold text-amber-500 font-mono mt-0.5">
                    4 Stations
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span>Real-Time Broadcast Log</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-500">Live SSE Feed</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2.5 max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 border-b border-slate-900/80 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-slate-500 shrink-0 text-[11px]">{log.time}</span>
                      <span className={`font-bold shrink-0 text-[10px] px-1.5 py-0.2 rounded bg-slate-900 ${log.color}`}>
                        [{log.type}]
                      </span>
                      <span className="text-slate-300 break-words leading-relaxed text-[11px]">
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PANEL 7: SNAKE VIPER STUDIO                              */}
          {/* ======================================================== */}
          {activeFunction === "snake-studio" && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-red-950/40 via-slate-900 to-black border border-red-500/30 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_#ff003c]">
                    <Eye className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white flex items-center gap-2">
                      <span>Piercing Red Snake Eyes</span>
                      <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                        Ruby Focus
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300">
                      Venomous crimson irises with vertical slit pupils and multi-layer radiant glow.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-red-900/40">
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-red-300">Red Eye Glow Intensity</span>
                    <span className="font-mono text-red-400">
                      {Math.round(snakeConfig.eyeGlowIntensity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="2.5"
                    step="0.1"
                    value={snakeConfig.eyeGlowIntensity}
                    onChange={(e) =>
                      setSnakeConfig((prev) => ({
                        ...prev,
                        eyeGlowIntensity: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-red-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  Snake Scale Color Scheme (Website Accordant)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      id: "emerald",
                      name: "Emerald Obsidian",
                      desc: "GourmetOS Default",
                      color: "from-emerald-900 to-slate-900 border-emerald-500/40",
                    },
                    {
                      id: "gold",
                      name: "24k Amber Gold",
                      desc: "Luxury Brass & Honey",
                      color: "from-amber-900 to-slate-900 border-amber-500/40",
                    },
                    {
                      id: "crimson",
                      name: "Crimson Phantom",
                      desc: "Fiery Ruby & Shadow",
                      color: "from-rose-900 to-slate-900 border-rose-500/40",
                    },
                    {
                      id: "silver",
                      name: "Liquid Mercury",
                      desc: "Brushed Titanium",
                      color: "from-slate-700 to-slate-900 border-slate-400/40",
                    },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setSnakeConfig((prev) => ({ ...prev, theme: t.id as SnakeTheme }))
                      }
                      className={`p-3.5 rounded-xl border text-left bg-gradient-to-br transition-all cursor-pointer ${t.color} ${snakeConfig.theme === t.id
                          ? "ring-2 ring-red-500 shadow-lg scale-[1.02]"
                          : "opacity-80 hover:opacity-100"
                        }`}
                    >
                      <div className="font-bold text-xs text-white">{t.name}</div>
                      <div className="text-[10px] text-slate-300 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-700 dark:text-slate-300">Slither Velocity</span>
                    <span className="font-mono text-slate-500">{snakeConfig.speed}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="6.0"
                    step="0.5"
                    value={snakeConfig.speed}
                    onChange={(e) =>
                      setSnakeConfig((prev) => ({
                        ...prev,
                        speed: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-700 dark:text-slate-300">Snake Spine Length</span>
                    <span className="font-mono text-slate-500">
                      {snakeConfig.segmentCount} Segments
                    </span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="65"
                    step="5"
                    value={snakeConfig.segmentCount}
                    onChange={(e) =>
                      setSnakeConfig((prev) => ({
                        ...prev,
                        segmentCount: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        Follow Mouse Pointer
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Tracks cursor across landing page or wanders freely
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={snakeConfig.followCursor}
                      onChange={(e) =>
                        setSnakeConfig((prev) => ({ ...prev, followCursor: e.target.checked }))
                      }
                      className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        Floating Energy Orbs
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Snake feeds on glowing orbs with particle bursts
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={snakeConfig.showFoodOrbs}
                      onChange={(e) =>
                        setSnakeConfig((prev) => ({ ...prev, showFoodOrbs: e.target.checked }))
                      }
                      className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>GourmetOS Real-Time Engine Active</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
