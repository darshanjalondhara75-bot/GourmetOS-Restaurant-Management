"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/authContext";
import { PageWrapper } from "@/components/PageWrapper";
import { getOrders, RestaurantOrder, adminCancelOrder } from "@/lib/api";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";
import {
  Filter,
  Calendar,
  Search,
  RefreshCw,
  Receipt,
  Table as TableIcon,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  Users,
  DollarSign
} from "lucide-react";

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [tableFilter, setTableFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  // Cancel/Refund Modal State
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    orderId: string | null;
    reason: string;
    isRefund: boolean;
  }>({
    open: false,
    orderId: null,
    reason: "",
    isRefund: false,
  });
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const ORDER_STATUSES = ["All", "Pending", "Accepted", "Preparing", "Ready", "Completed", "Cancelled"];

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders(
        statusFilter === "All" ? undefined : statusFilter,
        tableFilter || undefined
      );
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useRealtimeUpdates(loadOrders, ["orders"]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadOrders();
  }, [user, authLoading, statusFilter, tableFilter]);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    const matchesTable = !tableFilter || order.table_number.toLowerCase().includes(tableFilter.toLowerCase());
    const matchesSearch = !searchFilter || order.order_id.toLowerCase().includes(searchFilter.toLowerCase());

    let matchesDate = true;
    if (dateFilter) {
      const orderDate = new Date(order.created_at).toDateString();
      const selectedDate = new Date(dateFilter).toDateString();
      matchesDate = orderDate === selectedDate;
    }

    return matchesStatus && matchesTable && matchesSearch && matchesDate;
  });

  const toggleOrder = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openCancelModal = (orderId: string, isPaid: boolean) => {
    setCancelModal({
      open: true,
      orderId,
      reason: "",
      isRefund: isPaid,
    });
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModal.orderId) return;

    setIsSubmittingCancel(true);
    try {
      await adminCancelOrder(cancelModal.orderId, cancelModal.reason, cancelModal.isRefund);
      setCancelModal({ open: false, orderId: null, reason: "", isRefund: false });
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "Failed to cancel order.");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed": return "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800";
      case "Pending": return "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800";
      case "Cancelled": return "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-800";
      case "Ready": return "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800";
      default: return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700";
    }
  };

  // Analytical totals
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const completedCount = filteredOrders.filter(o => o.status === "Completed").length;

  return (
    <PageWrapper>
      <>
        <div className="page-with-fixed-nav min-h-screen bg-[#f7f8fc] dark:bg-slate-950 flex flex-col transition-colors duration-300">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="min-w-0 flex-1 p-4 sm:p-6 max-w-7xl mx-auto space-y-6 w-full">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-indigo">Admin</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">• Global Order Oversight</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">Order Registry</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Comprehensive historical record of all restaurant transactions.</p>
              </div>
              <button onClick={loadOrders} disabled={loading} className="btn-secondary text-xs font-bold w-full sm:w-auto min-h-10 justify-center flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Data
              </button>
            </div>

            {/* Quick Analytical Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Total Orders</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100 truncate">{filteredOrders.length}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Filtered Revenue</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100 truncate">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Completed</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100 truncate">{completedCount}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Success Rate</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100 truncate">
                    {filteredOrders.length > 0 ? ((completedCount / filteredOrders.length) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center gap-2 mb-2 text-slate-900 dark:text-slate-100">
                <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider">Query Filters</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Order Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-semibold appearance-none cursor-pointer"
                  >
                    {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Search Order ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="ORD-..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pl-9 p-2.5 font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Table Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <TableIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter table #..."
                      value={tableFilter}
                      onChange={(e) => setTableFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pl-9 p-2.5 font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pl-9 p-2.5 font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Order Registry</h2>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  {filteredOrders.length} Records
                </span>
              </div>

              {loading ? (
                <div className="p-20 text-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Fetching global orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-20 text-center space-y-3">
                  <div className="flex justify-center">
                    <Search className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No orders match your current filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 bg-slate-50/30 dark:bg-slate-900/30">
                  {filteredOrders.map((order) => {
                    const isExpanded = Boolean(expandedOrders[order.id]);
                    const isRefunded = order.payment_status === "Refunded" || order.status === "Cancelled";
                    const displayPaymentStatus = order.status === "Cancelled" ? "Refunded" : order.payment_status;
                    return (
                      <article key={order.id} className="group min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition duration-200 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-800">
                              <Receipt className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                                <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate"> {order.order_id}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ring-1 shrink-0 ${getStatusBadge(order.status)}`}>
                                  {order.status}
                                </span>
                                {isRefunded && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold ring-1 shrink-0 bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-800">
                                    Refunded
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-slate-500 dark:text-slate-400">
                                <span className="text-[10px] font-medium flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5" /> Table #{order.table_number}
                                </span>
                                <span className="text-[10px] font-medium flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" /> {new Date(order.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="text-right">
                              <p className="shrink-0 text-lg font-black tabular-nums text-slate-900 dark:text-slate-100">${order.total_amount.toFixed(2)}</p>
                              {order.payment_method === "Online" && (
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  ₹{(order.paid_amount ?? (order.total_amount * (order.payment_exchange_rate || 83))).toFixed(2)} INR
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => toggleOrder(order.id)}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition"
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Order Items */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Order Contents</p>
                                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{order.items?.length || 0} Items</span>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                  {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2 border border-slate-100 dark:border-slate-700 group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                      <img
                                        src={item.image_url || "https://placehold.co/100x100?text=Food"}
                                        alt={item.name}
                                        className="h-8 w-8 rounded-md object-cover bg-slate-200 shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                                      </div>
                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Order Metadata */}
                              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Payment & Details</p>
                                    {isRefunded && (
                                      <span className="rounded-full bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800">
                                        Refunded
                                      </span>
                                    )}
                                  </div>
                                  {order.status !== "Cancelled" && (
                                    <button
                                      onClick={() => openCancelModal(order.id, order.payment_status === "Paid")}
                                      className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition"
                                    >
                                      <AlertTriangle className="w-3 h-3" /> Cancel/Refund
                                    </button>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Payment Status:</span>
                                    <span className={`font-bold ${displayPaymentStatus === "Refunded" ? "text-rose-600 dark:text-rose-400" : displayPaymentStatus === "Paid" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                                      {displayPaymentStatus}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Payment Method:</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{order.payment_method || "Not Set"}</span>
                                  </div>
                                  <div className="flex justify-between text-xs py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Customer:</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{order.customer_name}</span>
                                  </div>
                                  {order.special_instructions && (
                                    <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Instructions:</p>
                                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{order.special_instructions}"</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
      {/* Cancel/Refund Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 transition-colors">
            <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Cancel / Refund Order</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              This action will mark the order as <span className="font-bold text-rose-600 dark:text-rose-400">Cancelled</span>.
              If the order was paid, it will be marked as <span className="font-bold text-rose-600 dark:text-rose-400">Refunded</span>.
            </p>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Reason for Exception</label>
                <textarea
                  required
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm rounded-xl focus:ring-rose-500 focus:border-rose-500 block p-3 min-h-[100px]"
                  placeholder="Example: Customer requested cancellation, Payment dispute, Incorrect item delivered..."
                />
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/20 cursor-pointer transition hover:bg-rose-100 dark:hover:bg-rose-900/30">
                <input
                  type="checkbox"
                  checked={cancelModal.isRefund}
                  onChange={(e) => setCancelModal({ ...cancelModal, isRefund: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Mark as Refunded (Financial Exception)</span>
              </label>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModal({ open: false, orderId: null, reason: "", isRefund: false })}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel || !cancelModal.reason}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-200 transition disabled:opacity-50"
                >
                  {isSubmittingCancel ? "Processing..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
    </PageWrapper>
  );
}
