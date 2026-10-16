"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/authContext";
import {
  getOrders,
  updateOrderStatus,
  cancelKitchenOrder,
  RestaurantOrder
} from "@/lib/api";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";
import { CheckCircle2, Flame, AlertCircle } from "lucide-react";

export default function KitchenPanelPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  useRealtimeUpdates(loadOrders, ["orders"]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadOrders();
  }, [user, authLoading]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      loadOrders();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update order status");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = window.prompt("Reason for cancellation (optional):");
    if (reason === null) return; // User cancelled the prompt

    try {
      await cancelKitchenOrder(orderId, reason);
      loadOrders();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to cancel order");
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const acceptedOrders = orders.filter((o) => o.status === "Accepted");
  const cookingOrders = orders.filter((o) => o.status === "Cooking" || o.status === "Preparing");
  const readyOrders = orders.filter((o) => o.status === "Ready");

  const Column = ({
    title,
    orders: colOrders,
    statusColor,
    accentColor,
    btnColor,
    btnText,
    btnIcon: BtnIcon,
    nextStatus,
    isReady = false
  }: any) => (
    <div className="flex h-fit min-w-0 flex-col space-y-4 self-start">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${accentColor}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {title} <span className="ml-1 text-slate-400 dark:text-slate-500 font-medium">({colOrders.length})</span>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {colOrders.map((ord: any) => (
          <div key={ord.id} className="bg-white dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md backdrop-blur-md">
            <div className={`h-1 w-full ${accentColor}`} />
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">{ord.order_id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap ${statusColor}`}>
                  Table {ord.table_number}
                </span>
              </div>
              {ord.order_token && (
                <p className="text-[10px] font-black tracking-wide text-[#176b57] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-lg px-2 py-1 whitespace-nowrap">
                  Order token {ord.order_token}
                </p>
              )}

              <div className="space-y-1.5">
                {ord.items.map((it: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 min-w-0">
                    <span className="text-slate-400 dark:text-slate-500 font-bold shrink-0">{it.quantity}x</span>
                    <span className="whitespace-nowrap leading-tight truncate min-w-0">{it.name}</span>
                  </div>
                ))}
              </div>

              {ord.special_instructions && (
                <div className="flex gap-2 p-2 bg-amber-50/80 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800/50">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium italic leading-tight break-words">
                    {ord.special_instructions}
                  </p>
                </div>
              )}

              {!isReady ? (
                <div className="flex items-stretch gap-2">
                  <button
                    onClick={() => handleUpdateStatus(ord.order_id, nextStatus)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${btnColor}`}
                  >
                    {BtnIcon && <BtnIcon className="w-3.5 h-3.5" />}
                    {btnText}
                  </button>
                  <button
                    onClick={() => handleCancelOrder(ord.order_id)}
                    className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 transition-colors text-xs font-bold flex items-center justify-center shrink-0"
                    title="Cancel Order"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-full py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-center text-[11px] font-bold uppercase tracking-wider">
                  ✓ Ready for Pickup
                </div>
              )}
            </div>
          </div>
        ))}
        {colOrders.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest">No Orders</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppShell>
          {/* Header */}
          <div className="chef-header bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-800">Chef Control</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">• Live Kitchen Feed</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight break-words">Kitchen Queue</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 break-words">Manage and update order statuses in real-time.</p>
            </div>
            <div className="chef-live-queue flex items-center gap-2 px-4 py-2 rounded-xl text-white shadow-md shrink-0 w-full sm:w-auto justify-center">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">Live Queue</span>
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 items-start md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <Column
              title="Pending"
              orders={pendingOrders}
              statusColor="bg-orange-50 text-orange-700"
              accentColor="bg-orange-500"
              btnColor="bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
              btnText="Accept Order"
              btnIcon={null}
              nextStatus="Accepted"
            />
            <Column
              title="Accepted"
              orders={acceptedOrders}
              statusColor="bg-blue-50 text-blue-700"
              accentColor="bg-blue-500"
              btnColor="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              btnText="Start Cooking"
              btnIcon={Flame}
              nextStatus="Cooking"
            />
            <Column
              title="Cooking"
              orders={cookingOrders}
              statusColor="bg-violet-50 text-violet-700"
              accentColor="bg-violet-500"
              btnColor="bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
              btnText="Mark Ready"
              btnIcon={CheckCircle2}
              nextStatus="Ready"
            />
            <Column
              title="Ready"
              orders={readyOrders}
              statusColor="bg-emerald-50 text-emerald-700"
              accentColor="bg-emerald-500"
              btnColor="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              btnText="Picked Up"
              isReady={true}
            />
          </div>
    </AppShell>
  );
}
