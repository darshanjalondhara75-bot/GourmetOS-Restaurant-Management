"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Sparkles,
  Utensils,
  QrCode,
  Calendar,
  ShoppingCart,
  Flame,
  CheckCircle2,
  CreditCard,
  ChefHat,
  PackageCheck,
  FileCheck2,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  Clock
} from "lucide-react";

export default function ArchitectureFlowSection() {
  const [activeFlow, setActiveFlow] = useState<"ordering" | "inventory">("ordering");
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);

  // Ordering Flow Steps
  const orderingSteps = [
    {
      step: 1,
      actor: "CUSTOMER",
      title: "Table Booking",
      icon: Calendar,
      endpoint: "POST /api/bookings",
      desc: "Diner reserves an available table specifying party size and arrival time.",
      state: "Table status transitions to 'Reserved' with customer name attached.",
      db: "tables_collection & bookings_collection",
    },
    {
      step: 2,
      actor: "CUSTOMER",
      title: "QR Ordering Scan",
      icon: QrCode,
      endpoint: "GET /customer/menu?tableId=X",
      desc: "Diner scans physical table QR code, initiating a cryptographically secure dining session.",
      state: "One-time session token issued to client; table verified as active.",
      db: "dining_sessions",
    },
    {
      step: 3,
      actor: "CUSTOMER",
      title: "Menu Browsing",
      icon: Utensils,
      endpoint: "GET /api/menu/items",
      desc: "Diner explores dishes categorized by Appetizers, Mains, Desserts, Beverages with dietary tags.",
      state: "Client caches menu items with real-time availability filters.",
      db: "menu_items_collection",
    },
    {
      step: 4,
      actor: "CUSTOMER",
      title: "Cart Customization",
      icon: ShoppingCart,
      endpoint: "Client State (Context API)",
      desc: "Diner adjusts item portions and attaches specific kitchen preparation notes.",
      state: "Cart subtotal calculated locally with instant tax & portion checks.",
      db: "Session Storage",
    },
    {
      step: 5,
      actor: "CUSTOMER",
      title: "Order Submission",
      icon: CheckCircle2,
      endpoint: "POST /api/orders",
      desc: "Diner submits cart. The backend atomically consumes the dining session token.",
      state: "Order created with status 'Pending' and payment_status 'Unpaid'.",
      db: "orders_collection",
    },
    {
      step: 6,
      actor: "CHEF",
      title: "Chef Line Dispatch",
      icon: ChefHat,
      endpoint: "SSE /api/realtime/events",
      desc: "The order is pushed to the Chef Kitchen Display board without polling.",
      state: "Ticket rings on kitchen screen; chef reviews items and prep time.",
      db: "In-memory SSE event bus",
    },
    {
      step: 7,
      actor: "CHEF",
      title: "Order Preparation",
      icon: Flame,
      endpoint: "PATCH /api/orders/{id}/status",
      desc: "Chef accepts ticket and advances status from 'Accepted' to 'Cooking' and finally 'Ready'.",
      state: "Elapsed timer monitors kitchen ticket lifecycle; status broadcasts to diner.",
      db: "orders_collection",
    },
    {
      step: 8,
      actor: "CASHIER",
      title: "Cashier POS Review",
      icon: Layers,
      endpoint: "GET /api/orders?payment_status=Unpaid",
      desc: "Cashier views itemized unpaid bill for the table and prepares billing.",
      state: "Table floor indicates Occupied status with active order total.",
      db: "orders_collection & tables_collection",
    },
    {
      step: 9,
      actor: "CASHIER",
      title: "Payment Processing",
      icon: CreditCard,
      endpoint: "POST /api/orders/{id}/pay",
      desc: "Cashier records payment via Cash, Card, or Razorpay (USD/INR conversion).",
      state: "Payment status marked 'Paid'; itemized receipt rendered.",
      db: "orders_collection (paid_amount, paid_at)",
    },
    {
      step: 10,
      actor: "SYSTEM",
      title: "Order Completion & Release",
      icon: PackageCheck,
      endpoint: "PATCH /api/tables/{id}/status",
      desc: "Order is completed, dining session closes, and table returns to 'Available'.",
      state: "Dining table freed for next guest reservation; metrics aggregated.",
      db: "tables_collection status: 'Available'",
    },
  ];

  // Inventory & Audit Flow Steps
  const inventorySteps = [
    {
      step: 1,
      actor: "CHEF",
      title: "Raw Stock Consumption",
      icon: Utensils,
      endpoint: "POST /api/inventory/usage",
      desc: "Kitchen logs daily raw ingredient usage across recipe preparation.",
      state: "Calculated stock decrements against opening inventory.",
      db: "inventory_usage_collection",
    },
    {
      step: 2,
      actor: "CHEF",
      title: "Purchase Records",
      icon: PackageCheck,
      endpoint: "POST /api/inventory/purchases",
      desc: "Incoming supplier deliveries are recorded with unit quantities and purchase costs.",
      state: "Procured ingredients added to stock register.",
      db: "inventory_purchases_collection",
    },
    {
      step: 3,
      actor: "CHEF",
      title: "Physical Audit Submission",
      icon: FileCheck2,
      endpoint: "POST /api/inventory/audit",
      desc: "Chef inputs actual physical counted quantities during shift handover.",
      state: "System records physical counts and calculates variance against expected theoretical stock.",
      db: "inventory_audits (status: 'Pending')",
    },
    {
      step: 4,
      actor: "ADMIN",
      title: "Admin Audit Review",
      icon: ShieldCheck,
      endpoint: "GET /api/inventory/audits/pending",
      desc: "Restaurant administrator inspects recorded variances, wastage notes, and discrepancies.",
      state: "Admin approves or rejects stock variance with audit remarks.",
      db: "inventory_audits (status: 'Approved')",
    },
    {
      step: 5,
      actor: "ADMIN",
      title: "Reconciliation & Purchase Order",
      icon: TrendingUp,
      endpoint: "POST /api/inventory/requirements",
      desc: "Official stock levels reconciled; low-stock threshold triggers automatic purchase requisition.",
      state: "Stock ledger finalized; replenishment orders flagged.",
      db: "inventory_items_collection (current_stock updated)",
    },
  ];

  const currentSteps = activeFlow === "ordering" ? orderingSteps : inventorySteps;
  const activeStep = currentSteps[selectedStepIndex] || currentSteps[0];
  const StepIcon = activeStep.icon;

  return (
    <section id="architecture" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level 4: System Architecture &amp; User Flow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            End-to-End Operational Lifecycle
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Interactive visual flow detailing the multi-tier interaction between Customers, Chefs, Cashiers, and Admins.
          </p>
        </div>

        {/* Flow Selector Switcher */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <button
            onClick={() => {
              setActiveFlow("ordering");
              setSelectedStepIndex(0);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeFlow === "ordering"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-emerald-500/20"
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>1. Dine-In &amp; Order Lifecycle (10 Stages)</span>
          </button>

          <button
            onClick={() => {
              setActiveFlow("inventory");
              setSelectedStepIndex(0);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeFlow === "inventory"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-emerald-500/20"
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>2. Kitchen Inventory &amp; Audit Pipeline (5 Stages)</span>
          </button>
        </div>

        {/* Step Nodes Horizontal / Multi-Row Flow */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-emerald-500/25 backdrop-blur-xl shadow-xl mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            {currentSteps.map((s, idx) => {
              const Icon = s.icon;
              const isSelected = selectedStepIndex === idx;
              return (
                <button
                  key={s.step}
                  onClick={() => setSelectedStepIndex(idx)}
                  className={`p-3.5 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between group ${
                    isSelected
                      ? "bg-emerald-500/20 border-emerald-400 text-slate-100 shadow-md shadow-emerald-500/20 scale-[1.02]"
                      : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-emerald-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? "bg-emerald-400 text-slate-950" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      Step {s.step}
                    </span>
                    <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-slate-500"}`} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">
                      {s.actor}
                    </div>
                    <div className="text-xs font-bold text-slate-200 leading-tight mt-0.5">
                      {s.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Deep-Dive Inspector Box */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-emerald-500/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <StepIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs uppercase font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>Step {activeStep.step}</span>
                    <span>•</span>
                    <span>{activeStep.actor} ACTION</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-100">
                    {activeStep.title}
                  </h3>
                </div>
              </div>

              {/* Endpoint Badge */}
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-emerald-500/30 font-mono text-xs text-emerald-300">
                {activeStep.endpoint}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-semibold mb-1">Functional Description</div>
                <div className="text-slate-200 leading-relaxed">{activeStep.desc}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-semibold mb-1">State Transition</div>
                <div className="text-emerald-400 leading-relaxed">{activeStep.state}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-semibold mb-1">Database &amp; Protocol</div>
                <div className="font-mono text-xs text-slate-300 leading-relaxed">{activeStep.db}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
