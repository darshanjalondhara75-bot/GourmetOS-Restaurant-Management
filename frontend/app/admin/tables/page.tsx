"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/authContext";
import {
  getTables,
  createTable,
  updateTableStatus,
  deleteTable,
  DiningTable
} from "@/lib/api";
import { Grid, Plus, QrCode, Trash2, CheckCircle2, AlertCircle, RefreshCw, X, Radio } from "lucide-react";
import Link from "next/link";
import { CustomSelect } from "@/components/CustomSelect";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";

export default function TableManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [qrModalTable, setQrModalTable] = useState<DiningTable | null>(null);

  // Add Table state
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [status, setStatus] = useState("Available");

  const loadTables = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getTables();
      setTables(data);
    } catch (err) {
      console.error("Error loading tables:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useRealtimeUpdates(() => loadTables(true), ["tables", "bookings", "orders"]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadTables();
  }, [user, authLoading]);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalizedNumber = tableNumber.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
      if (!normalizedNumber) {
        alert("Enter a valid table number.");
        return;
      }
      await createTable({ table_number: normalizedNumber, capacity, status });
      setShowAddModal(false);
      setTableNumber("");
      loadTables();
    } catch (err: any) {
      alert(err.message || "Failed to create table");
    }
  };

  const handleStatusChange = async (tableNum: string, newStatus: string) => {
    try {
      await updateTableStatus(tableNum, newStatus);
      loadTables();
    } catch (err: any) {
      alert(err.message || "Failed to update table status");
    }
  };

  const handleDeleteTable = async (tableNum: string) => {
    if (!confirm(`Delete Table ${tableNum}?`)) return;
    try {
      await deleteTable(tableNum);
      loadTables();
    } catch (err: any) {
      alert(err.message || "Failed to delete table");
    }
  };

  return (
    <AppShell>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="badge badge-purple">Module 6</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">• Dining & QR Codes</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <Radio className="w-3 h-3" /> Live Sync · 2s
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Table Management & QR Mapping
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Manage table numbers, seating capacity, real-time availability & QR digital menus.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs font-bold py-2.5 px-4 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Add New Table
            </button>
          </div>

          {/* Table Cards Grid */}
          {tables.length === 0 && !loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center">
              <Grid className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No dining tables configured.</p>
              <p className="text-xs text-slate-400 mt-1">Add a table and it will be visible to customers automatically.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {tables.map((t) => (
              <div key={t.id} className="light-card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                      Table #{t.table_number}
                    </span>
                    <span
                      className={`badge ${
                        t.status === "Available"
                          ? "badge-emerald"
                          : t.status === "Occupied"
                          ? "badge-amber"
                          : t.status === "Reserved"
                          ? "badge-purple"
                          : "badge-rose"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">
                    Capacity: <strong className="text-slate-700 dark:text-slate-200">{t.capacity} Seats</strong>
                  </p>
                  {t.reserved_by_name && (
                    <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300">
                      Customer: <span className="font-black">{t.reserved_by_name}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <CustomSelect
                    value={t.status}
                    options={[
                      { label: "Available", value: "Available" },
                      { label: "Occupied", value: "Occupied" },
                      { label: "Reserved", value: "Reserved" },
                      { label: "Cleaning", value: "Cleaning" },
                    ]}
                    onChange={(val) => handleStatusChange(t.table_number, val)}
                    className="flex-1 max-w-[140px]"
                  />

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQrModalTable(t)}
                      className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition flex items-center justify-center"
                      title="Show Digital QR Menu"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTable(t.table_number)}
                      className="p-2 rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition flex items-center justify-center"
                      title="Delete Table"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Add Table Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add Dining Table</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateTable} className="space-y-4">
                  <div className="input-group">
                    <label className="input-label text-slate-700 dark:text-slate-300">Table Number</label>
                    <input
                      type="text"
                      className="custom-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                      placeholder="e.g. 7"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label text-slate-700 dark:text-slate-300">Seating Capacity</label>
                    <input
                      type="number"
                      className="custom-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                      min={1}
                      max={20}
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label text-slate-700 dark:text-slate-300">Initial Status</label>
                    <CustomSelect
                      value={status}
                      options={[
                        { label: "Available", value: "Available" },
                        { label: "Occupied", value: "Occupied" },
                        { label: "Reserved", value: "Reserved" },
                        { label: "Cleaning", value: "Cleaning" },
                      ]}
                      onChange={setStatus}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary text-xs">
                      Save Table
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* QR Modal */}
          {qrModalTable && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-center transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Table #{qrModalTable.table_number} QR Code</h3>
                  <button onClick={() => setQrModalTable(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Scan or click link to open customer table menu</p>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 inline-block mb-4">
                  <div className="w-48 h-48 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                    <QrCode className="w-32 h-32 text-slate-900 dark:text-slate-100" />
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-2">Scan Table #{qrModalTable.table_number}</span>
                  </div>
                </div>

                <div>
                  <Link
                    href={`/customer/menu?tableId=${qrModalTable.table_number}`}
                    target="_blank"
                    className="btn-primary text-xs w-full py-2.5"
                  >
                    Open Digital Customer Menu &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}
    </AppShell>
  );
}
