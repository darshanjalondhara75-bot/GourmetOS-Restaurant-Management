"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CustomSelect } from "@/components/CustomSelect";
import { useAuth } from "@/lib/authContext";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";
import {
  addInventoryConsumption,
  addInventoryPurchase,
  addInventoryWastage,
  adjustInventoryStock,
  createPurchaseRequirement,
  getInventoryAudit,
  getInventoryConsumption,
  getInventoryItems,
  getInventoryPurchases,
  getInventorySummary,
  getInventoryWastage,
  getPurchaseRequirements,
  InventoryItem,
  InventorySummary,
  updatePurchaseRequirementStatus,
} from "@/lib/api";
import {
  Archive,
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  Filter,
  History,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";

interface InventoryPanelProps {
  mode: "chef" | "admin";
}

type Tab = "overview" | "purchases" | "consumption" | "wastage" | "requirements" | "audit";

type Tx = {
  id: string;
  item_id?: string;
  item?: string;
  item_name?: string;
  category?: string;
  unit?: string;
  quantity?: number;
  quantity_used?: number;
  required_quantity?: number;
  total_cost?: number;
  unit_price?: number;
  supplier?: string;
  vendor?: string;
  invoice_number?: string;
  purchase_date?: string;
  created_at?: string;
  date_time?: string;
  date?: string;
  request_date?: string;
  requested_by?: string;
  updated_by?: string;
  performed_by?: string;
  reason?: string;
  notes?: string;
  related_order?: string;
  priority?: string;
  status?: string;
  reference?: string;
  action?: string;
  amount?: number;
  timestamp?: string;
};

const CATEGORY_NAMES = [
  "Produce",
  "Dairy",
  "Meat & Poultry",
  "Seafood",
  "Pantry",
  "Grains & Rice",
  "Spices & Sauces",
  "Beverages",
  "Bakery",
  "Frozen",
  "Cleaning",
  "Other",
];

const UNIT_NAMES = ["kg", "gram", "litre", "ml", "piece", "packet", "box", "dozen"];
const WASTAGE_REASONS = ["Spoiled", "Burnt", "Damaged", "Expired", "Preparation Waste", "Other"];
const PRIORITIES = ["Critical", "High", "Normal"];
const ACTIONS = ["PURCHASE", "CONSUMPTION", "WASTAGE", "STOCK ADJUSTMENT", "REQUIREMENT"];
const REQUIREMENT_STATUSES = ["Pending", "Approved", "Rejected", "Purchased", "Completed"];

const cardTone: Record<string, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
  orange: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300",
  red: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
  blue: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
  slate: "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
};

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function qty(value?: number) {
  return Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 });
}

function dateTime(value?: string) {
  return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

function statusTone(status: string) {
  if (status === "In Stock") return cardTone.green;
  if (status === "Low Stock") return cardTone.orange;
  return cardTone.red;
}

function priorityTone(priority?: string) {
  if (priority === "Critical") return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/60";
  if (priority === "High") return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/60";
  return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
}

function optionize(values: string[]) {
  return values.map((value) => ({ label: value, value }));
}

export default function InventoryPanel({ mode }: InventoryPanelProps) {
  const { user, loading: authLoading } = useAuth();
  const canManage = mode === "chef";
  const router = useRouter();
  const searchParams = useSearchParams();

  // Restore state from URL search params on mount/refresh
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "overview");
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<Tx[]>([]);
  const [consumption, setConsumption] = useState<Tx[]>([]);
  const [wastage, setWastage] = useState<Tx[]>([]);
  const [requirements, setRequirements] = useState<Tx[]>([]);
  const [audit, setAudit] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "All");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "All");
  const [actionFilter, setActionFilter] = useState(searchParams.get("action") || "All");
  const [staffFilter, setStaffFilter] = useState(searchParams.get("staff") || "");
  const [auditDateFrom, setAuditDateFrom] = useState(searchParams.get("from") || "");
  const [auditDateTo, setAuditDateTo] = useState(searchParams.get("to") || "");
  const [auditSupplier, setAuditSupplier] = useState(searchParams.get("supplier") || "");
  const [auditCategory, setAuditCategory] = useState(searchParams.get("auditCategory") || "All");
  const [auditStatus, setAuditStatus] = useState(searchParams.get("auditStatus") || "All");

  const [showPurchase, setShowPurchase] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [showWastage, setShowWastage] = useState(false);
  const [showRequirement, setShowRequirement] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state to URL search params so page position persists on refresh
  useEffect(() => {
    const params = new URLSearchParams();
    if (tab !== "overview") params.set("tab", tab);
    if (search) params.set("q", search);
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (categoryFilter !== "All") params.set("category", categoryFilter);
    if (actionFilter !== "All") params.set("action", actionFilter);
    if (staffFilter) params.set("staff", staffFilter);
    if (auditDateFrom) params.set("from", auditDateFrom);
    if (auditDateTo) params.set("to", auditDateTo);
    if (auditSupplier) params.set("supplier", auditSupplier);
    if (auditCategory !== "All") params.set("auditCategory", auditCategory);
    if (auditStatus !== "All") params.set("auditStatus", auditStatus);
    const queryString = params.toString();
    router.replace(queryString ? `?${queryString}` : "", { scroll: false });
  }, [tab, search, statusFilter, categoryFilter, actionFilter, staffFilter, auditDateFrom, auditDateTo, auditSupplier, auditCategory, auditStatus, router]);

  const [purchaseForm, setPurchaseForm] = useState({
    item_name: "",
    category: "Produce",
    quantity: "",
    unit: "kg",
    unit_price: "",
    supplier: "",
    purchase_date: new Date().toISOString().slice(0, 10),
    invoice_number: "",
    notes: "",
    bill_image_url: "",
    minimum_level: "",
  });
  const [usageForm, setUsageForm] = useState({ item_id: "", quantity_used: "", unit: "kg", date_time: new Date().toISOString().slice(0, 16), related_order: "", notes: "" });
  const [wastageForm, setWastageForm] = useState({ item_id: "", quantity: "", reason: "Spoiled", date: new Date().toISOString().slice(0, 10), notes: "" });
  const [reqForm, setReqForm] = useState({ item_id: "", required_quantity: "", unit: "kg", reason: "Low stock", priority: "Normal", notes: "" });
  const [adjustmentForm, setAdjustmentForm] = useState({ item_id: "", quantity_delta: "", reason: "Manual stock adjustment", reference: "" });

  const categories = useMemo(() => Array.from(new Set([...CATEGORY_NAMES, ...items.map((item) => item.category).filter(Boolean)])).sort(), [items]);
  const categoryOptions = useMemo(() => optionize(categories), [categories]);
  const itemOptions = useMemo(() => items.map((item) => ({ label: `${item.name} · ${qty(item.current_stock)} ${item.unit}`, value: item.id })), [items]);
  const unitOptions = useMemo(() => optionize(UNIT_NAMES), []);
  const reasonOptions = useMemo(() => optionize(WASTAGE_REASONS), []);
  const priorityOptions = useMemo(() => optionize(PRIORITIES), []);
  const actionOptions = useMemo(() => optionize(["All", ...ACTIONS]), []);
  const statusOptions = useMemo(() => optionize(["All", "In Stock", "Low Stock", "Out of Stock"]), []);
  const requirementStatusOptions = useMemo(() => optionize(["All", ...REQUIREMENT_STATUSES, "In Stock", "Low Stock", "Out of Stock"]), []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !q || `${item.name} ${item.category} ${item.unit}`.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, search, statusFilter, categoryFilter]);

  const aggregated = useMemo(() => {
    const map = new Map<string, { item: InventoryItem; purchased: number; used: number; wasted: number }>();
    items.forEach((item) => map.set(item.id, { item, purchased: 0, used: 0, wasted: 0 }));
    purchases.forEach((tx) => {
      const row = map.get(tx.item_id || "");
      if (row) row.purchased += Number(tx.quantity || 0);
    });
    consumption.forEach((tx) => {
      const row = map.get(tx.item_id || "");
      if (row) row.used += Number(tx.quantity_used || 0);
    });
    wastage.forEach((tx) => {
      const row = map.get(tx.item_id || "");
      if (row) row.wasted += Number(tx.quantity || 0);
    });
    return Array.from(map.values());
  }, [items, purchases, consumption, wastage]);

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [summaryData, itemData, purchaseData, consumptionData, wastageData, requirementData, auditData] = await Promise.all([
        getInventorySummary(),
        getInventoryItems(),
        getInventoryPurchases(),
        getInventoryConsumption(),
        getInventoryWastage(),
        getPurchaseRequirements(),
        getInventoryAudit(),
      ]);
      setSummary(summaryData);
      setItems(itemData);
      setPurchases(purchaseData);
      setConsumption(consumptionData);
      setWastage(wastageData);
      setRequirements(requirementData);
      setAudit(auditData);
    } catch (error) {
      if (!silent) {
        setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to load inventory data." });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useRealtimeUpdates(() => loadAll(true), ["inventory"]);

  useEffect(() => {
    if (authLoading || !user || (user.role !== "admin" && user.role !== "chef")) return;
    loadAll();
  }, [user, authLoading]);

  const openPurchase = () => {
    setPurchaseForm({
      item_name: "",
      category: categories[0] || "Produce",
      quantity: "",
      unit: "kg",
      unit_price: "",
      supplier: "",
      purchase_date: new Date().toISOString().slice(0, 10),
      invoice_number: "",
      notes: "",
      bill_image_url: "",
      minimum_level: "",
    });
    setShowPurchase(true);
  };

  const openUsage = () => {
    const first = items[0];
    setUsageForm({ item_id: first?.id || "", quantity_used: "", unit: first?.unit || "kg", date_time: new Date().toISOString().slice(0, 16), related_order: "", notes: "" });
    setShowUsage(true);
  };

  const openWastage = () => {
    const first = items[0];
    setWastageForm({ item_id: first?.id || "", quantity: "", reason: "Spoiled", date: new Date().toISOString().slice(0, 10), notes: "" });
    setShowWastage(true);
  };

  const openRequirement = (item?: InventoryItem) => {
    const shortage = item ? Math.max(0, item.minimum_level - item.current_stock) : 0;
    const priority = item && item.current_stock <= 0 ? "Critical" : item && item.current_stock < item.minimum_level * 0.5 ? "High" : "Normal";
    setReqForm({ item_id: item?.id || items[0]?.id || "", required_quantity: shortage ? String(shortage) : "", unit: item?.unit || items[0]?.unit || "kg", reason: item ? "Below minimum stock" : "Low stock", priority, notes: "" });
    setShowRequirement(true);
  };

  const openAdjustment = (item?: InventoryItem) => {
    setAdjustmentForm({ item_id: item?.id || items[0]?.id || "", quantity_delta: "", reason: "Manual stock adjustment", reference: "" });
    setShowAdjustment(true);
  };

  const handleBillImage = (file?: File) => {
    if (!file) return;
    if (file.size > 1_500_000) {
      setNotice({ type: "error", text: "Please keep bill images under 1.5 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPurchaseForm((form) => ({ ...form, bill_image_url: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const savePurchase = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const quantity = Number(purchaseForm.quantity);
      const unitPrice = Number(purchaseForm.unit_price);
      if (!purchaseForm.item_name.trim() || quantity <= 0 || unitPrice < 0) throw new Error("Enter item name, a positive quantity and a valid unit price.");
      await addInventoryPurchase({
        ...purchaseForm,
        item_name: purchaseForm.item_name.trim(),
        quantity,
        unit_price: unitPrice,
        total_cost: quantity * unitPrice,
        minimum_level: Number(purchaseForm.minimum_level || 0),
        bill_image_url: purchaseForm.bill_image_url || undefined,
      });
      setShowPurchase(false);
      setNotice({ type: "success", text: `${purchaseForm.item_name} purchase saved and stock increased by ${qty(quantity)} ${purchaseForm.unit}.` });
      await loadAll();
      setTab("purchases");
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Purchase save failed." });
    } finally {
      setSaving(false);
    }
  };

  const saveUsage = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const selected = items.find((item) => item.id === usageForm.item_id);
      const quantityUsed = Number(usageForm.quantity_used);
      if (!selected || quantityUsed <= 0) throw new Error("Select an item and enter a positive usage quantity.");
      await addInventoryConsumption({
        item_id: selected.id,
        item_name: selected.name,
        quantity_used: quantityUsed,
        unit: selected.unit,
        date_time: usageForm.date_time,
        related_order: usageForm.related_order,
        notes: usageForm.notes,
      });
      setShowUsage(false);
      setNotice({ type: "success", text: `${selected.name} consumption recorded and stock reduced.` });
      await loadAll();
      setTab("consumption");
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Consumption save failed." });
    } finally {
      setSaving(false);
    }
  };

  const saveWastage = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const selected = items.find((item) => item.id === wastageForm.item_id);
      const quantity = Number(wastageForm.quantity);
      if (!selected || quantity <= 0) throw new Error("Select an item and enter a positive wastage quantity.");
      await addInventoryWastage({
        item_id: selected.id,
        item_name: selected.name,
        quantity,
        unit: selected.unit,
        reason: wastageForm.reason,
        date: wastageForm.date,
        notes: wastageForm.notes,
      });
      setShowWastage(false);
      setNotice({ type: "success", text: `${selected.name} wastage recorded successfully.` });
      await loadAll();
      setTab("wastage");
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Wastage save failed." });
    } finally {
      setSaving(false);
    }
  };

  const saveRequirement = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const selected = items.find((item) => item.id === reqForm.item_id);
      const requiredQuantity = Number(reqForm.required_quantity);
      if (!selected || requiredQuantity <= 0) throw new Error("Select an item and enter the required quantity.");
      await createPurchaseRequirement({
        item_id: selected.id,
        item_name: selected.name,
        required_quantity: requiredQuantity,
        unit: selected.unit,
        reason: reqForm.reason,
        priority: reqForm.priority,
        notes: reqForm.notes,
      });
      setShowRequirement(false);
      setNotice({ type: "success", text: "Purchase requirement sent to Admin." });
      await loadAll();
      setTab("requirements");
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Requirement creation failed." });
    } finally {
      setSaving(false);
    }
  };

  const saveAdjustment = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const selected = items.find((item) => item.id === adjustmentForm.item_id);
      const delta = Number(adjustmentForm.quantity_delta);
      if (!selected || !delta || !adjustmentForm.reason.trim()) throw new Error("Select an item, enter a non-zero adjustment and provide a reason.");
      await adjustInventoryStock({ item_id: selected.id, quantity_delta: delta, reason: adjustmentForm.reason.trim(), reference: adjustmentForm.reference.trim() });
      setShowAdjustment(false);
      setNotice({ type: "success", text: `${selected.name} stock adjusted by ${delta > 0 ? "+" : ""}${qty(delta)} ${selected.unit}.` });
      await loadAll();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Stock adjustment failed." });
    } finally {
      setSaving(false);
    }
  };

  const setRequirementStatus = async (id: string, status: string) => {
    try {
      await updatePurchaseRequirementStatus(id, status);
      setNotice({ type: "success", text: `Requirement marked ${status}.` });
      await loadAll();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Status update failed." });
    }
  };

  const auditRows = useMemo(() => audit.filter((row) => {
    const q = search.trim().toLowerCase();
    const date = row.timestamp || "";
    const fromOk = !auditDateFrom || date.slice(0, 10) >= auditDateFrom;
    const toOk = !auditDateTo || date.slice(0, 10) <= auditDateTo;
    const categoryOk = auditCategory === "All" || row.category === auditCategory;
    const statusOk = auditStatus === "All" || row.status === auditStatus;
    const actionOk = actionFilter === "All" || row.action === actionFilter;
    const staffOk = !staffFilter.trim() || String(row.performed_by || "").toLowerCase().includes(staffFilter.trim().toLowerCase());
    const supplierOk = !auditSupplier.trim() || String(row.supplier || "").toLowerCase().includes(auditSupplier.trim().toLowerCase());
    const searchOk = !q || `${row.item || ""} ${row.action || ""} ${row.reason || ""} ${row.reference || ""}`.toLowerCase().includes(q);
    return fromOk && toOk && categoryOk && statusOk && actionOk && staffOk && supplierOk && searchOk;
  }), [audit, search, auditDateFrom, auditDateTo, auditCategory, auditStatus, actionFilter, staffFilter, auditSupplier]);

  const tabs: { key: Tab; label: string; icon: React.ElementType; description: string }[] = [
    { key: "overview", label: "Stock Overview", icon: PackageCheck, description: "Current kitchen stock" },
    { key: "purchases", label: "Purchases", icon: ArrowDownCircle, description: "Purchase history" },
    { key: "consumption", label: "Consumption", icon: ArrowUpCircle, description: "Ingredient usage" },
    { key: "wastage", label: "Wastage", icon: Trash2, description: "Waste register" },
    { key: "requirements", label: "Requirements", icon: ClipboardCheck, description: "Items to purchase" },
    { key: "audit", label: "Audit Trail", icon: History, description: "Complete activity log" },
  ];

  return (
    <AppShell>
            <div className="space-y-5">
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-5 p-5 sm:p-7 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                        {mode === "chef" ? "Chef Panel" : "Admin Panel"}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">Inventory & Kitchen Stock</span>
                    </div>
                    <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Inventory & Stock Management</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Track purchases, kitchen consumption, wastage, low-stock requirements and every stock movement from one professional workspace.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => loadAll()} className="btn-secondary inline-flex items-center gap-2 px-3 py-2.5 text-xs font-black">
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                    {canManage && (
                      <>
                        <button onClick={openPurchase} className="btn-primary inline-flex items-center gap-2 px-3 py-2.5 text-xs font-black"><Plus className="h-4 w-4" /> Add Purchase</button>
                        <button onClick={openUsage} className="btn-secondary inline-flex items-center gap-2 px-3 py-2.5 text-xs font-black"><ArrowUpCircle className="h-4 w-4" /> Record Usage</button>
                        <button onClick={openWastage} className="btn-secondary inline-flex items-center gap-2 px-3 py-2.5 text-xs font-black"><Trash2 className="h-4 w-4" /> Record Wastage</button>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {notice && (
                <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold shadow-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"}`}>
                  {notice.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                  <span className="flex-1">{notice.text}</span>
                  <button onClick={() => setNotice(null)} aria-label="Close notice" className="rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
                </div>
              )}

              <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                {[
                  { label: "Stock Items", value: summary?.total_stock_items || 0, tone: "slate", icon: Archive },
                  { label: "Today's Purchases", value: money(summary?.todays_purchases), tone: "blue", icon: ArrowDownCircle },
                  { label: "Today's Consumption", value: money(summary?.todays_consumption), tone: "orange", icon: ArrowUpCircle },
                  { label: "Low Stock", value: summary?.low_stock_items || 0, tone: "orange", icon: TriangleAlert },
                  { label: "Wastage", value: money(summary?.wastage), tone: "red", icon: Trash2 },
                  { label: "Purchase Cost", value: money(summary?.total_purchase_cost), tone: "blue", icon: Factory },
                  { label: "Need Purchase", value: summary?.items_requiring_purchase || 0, tone: "red", icon: ClipboardCheck },
                ].map(({ label, value, tone, icon: Icon }) => (
                  <div key={label} className={`rounded-2xl border p-4 shadow-sm ${cardTone[tone]}`}>
                    <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-wide opacity-80">{label}</span><Icon className="h-4 w-4 opacity-80" /></div>
                    <div className="mt-2 text-xl font-black">{String(value)}</div>
                  </div>
                ))}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-6">
                  {tabs.map(({ key, label, icon: Icon, description }) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      aria-pressed={tab === key}
                      className={`group rounded-2xl px-3 py-3 text-left transition-all ${tab === key ? "bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                    >
                      <div className="flex items-center gap-2"><Icon className="h-4 w-4 shrink-0" /><span className="text-xs font-black leading-4">{label}</span></div>
                      <div className={`mt-1 hidden text-[10px] sm:block ${tab === key ? "text-white/70 dark:text-slate-500" : "text-slate-400"}`}>{description}</div>
                    </button>
                  ))}
                </div>
              </section>

              {(tab === "overview" || tab === "audit") && (
                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                  <div className="mb-3 flex items-center gap-2"><Filter className="h-4 w-4 text-slate-400" /><h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Filters & Search</h2></div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
                    <div className="relative sm:col-span-2 xl:col-span-4">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tab === "audit" ? "Search audit item, action, reason..." : "Search ingredient or category..."} className="custom-input pl-10" />
                    </div>
                    {tab === "overview" ? (
                      <>
                        <div className="xl:col-span-3"><CustomSelect value={categoryFilter} onChange={setCategoryFilter} options={[{ label: "All Categories", value: "All" }, ...categoryOptions]} placeholder="All Categories" searchable /></div>
                        <div className="xl:col-span-3"><CustomSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} placeholder="All Stock Statuses" /></div>
                        <button onClick={() => { setSearch(""); setCategoryFilter("All"); setStatusFilter("All"); router.replace(""); }} className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black sm:col-span-2 xl:col-span-2"><X className="h-4 w-4" /> Clear</button>
                      </>
                    ) : (
                      <>
                        <div className="xl:col-span-2"><CustomSelect value={actionFilter} onChange={setActionFilter} options={actionOptions} placeholder="All Actions" /></div>
                        <div className="xl:col-span-2"><CustomSelect value={auditCategory} onChange={setAuditCategory} options={[{ label: "All Categories", value: "All" }, ...categoryOptions]} placeholder="All Categories" searchable /></div>
                        <div className="xl:col-span-2"><CustomSelect value={auditStatus} onChange={setAuditStatus} options={requirementStatusOptions} placeholder="All Statuses" /></div>
                        <input value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)} placeholder="Chef / Staff" className="custom-input xl:col-span-2" />
                        <input type="date" value={auditDateFrom} onChange={(event) => setAuditDateFrom(event.target.value)} className="custom-input xl:col-span-2" aria-label="Audit start date" />
                        <input type="date" value={auditDateTo} onChange={(event) => setAuditDateTo(event.target.value)} className="custom-input xl:col-span-2" aria-label="Audit end date" />
                        <input value={auditSupplier} onChange={(event) => setAuditSupplier(event.target.value)} placeholder="Supplier / Vendor" className="custom-input xl:col-span-2" />
                        <button onClick={() => { setSearch(""); setActionFilter("All"); setAuditCategory("All"); setAuditStatus("All"); setStaffFilter(""); setAuditDateFrom(""); setAuditDateTo(""); setAuditSupplier(""); router.replace(""); }} className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black xl:col-span-2"><X className="h-4 w-4" /> Clear</button>
                      </>
                    )}
                  </div>
                </section>
              )}

              {tab === "overview" && (
                <section className="space-y-4">
                  <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[860px] table-fixed text-xs">
                        <colgroup>
                          <col className="w-[22%]" />
                          <col className="w-[10%]" />
                          <col className="w-[11%]" />
                          <col className="w-[10%]" />
                          <col className="w-[10%]" />
                          <col className="w-[13%]" />
                          <col className="w-[12%]" />
                          <col className="w-[12%]" />
                        </colgroup>
                        <thead className="bg-slate-50 dark:bg-slate-950/60">
                          <tr>
                            {["Ingredient", "Opening", "Purchased", "Used", "Wasted", "Current", "Minimum", "Status"].map((head) => (
                              <th
                                key={head}
                                className={`px-3 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500 ${head === "Ingredient" ? "text-left" : "text-center"}`}
                              >
                                {head}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {aggregated.filter((row) => filteredItems.some((item) => item.id === row.item.id)).map((row) => (
                            <tr key={row.item.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-950/40">
                              <td className="px-3 py-4 align-middle text-left">
                                <div className="font-black text-slate-900 dark:text-slate-100">{row.item.name}</div>
                                <div className="mt-0.5 text-[10px] text-slate-400">{row.item.category} · {row.item.unit}</div>
                              </td>
                              <td className="px-3 py-4 align-middle text-center font-semibold tabular-nums">{qty(row.item.opening_stock)}</td>
                              <td className="px-3 py-4 align-middle text-center font-bold tabular-nums text-sky-700 dark:text-sky-300">+{qty(row.purchased)}</td>
                              <td className="px-3 py-4 align-middle text-center font-bold tabular-nums text-amber-700 dark:text-amber-300">-{qty(row.used)}</td>
                              <td className="px-3 py-4 align-middle text-center font-bold tabular-nums text-rose-700 dark:text-rose-300">-{qty(row.wasted)}</td>
                              <td className="px-3 py-4 align-middle text-center font-black tabular-nums">{qty(row.item.current_stock)} {row.item.unit}</td>
                              <td className="px-3 py-4 align-middle text-center tabular-nums">{qty(row.item.minimum_level)} {row.item.unit}</td>
                              <td className="px-3 py-4 align-middle text-center">
                                <span className={`inline-flex min-w-[92px] items-center justify-center rounded-full border px-2.5 py-1 text-[10px] font-black leading-none whitespace-nowrap ${statusTone(row.item.status)}`}>
                                  {row.item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredItems.length === 0 && <EmptyState title="No stock items found" text="Add a purchase or adjust the filters to see inventory items." />}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                    {aggregated.filter((row) => filteredItems.some((item) => item.id === row.item.id)).map((row) => (
                      <div key={row.item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-black text-slate-950 dark:text-white">{row.item.name}</h3>
                            <p className="mt-1 text-[10px] text-slate-400">{row.item.category} · {row.item.unit}</p>
                          </div>
                          <span className={`shrink-0 inline-flex min-w-[92px] items-center justify-center rounded-full border px-2 py-1 text-[10px] font-black leading-none whitespace-nowrap ${statusTone(row.item.status)}`}>
                            {row.item.status}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                          <Metric label="Opening" value={qty(row.item.opening_stock)} />
                          <Metric label="Current" value={`${qty(row.item.current_stock)} ${row.item.unit}`} strong />
                          <Metric label="Purchased" value={`+${qty(row.purchased)}`} />
                          <Metric label="Used" value={`-${qty(row.used)}`} />
                          <Metric label="Wasted" value={`-${qty(row.wasted)}`} />
                          <Metric label="Minimum" value={`${qty(row.item.minimum_level)} ${row.item.unit}`} />
                        </div>
                      </div>
                    ))}
                    {filteredItems.length === 0 && <EmptyState title="No stock items found" text="Add a purchase or adjust the filters to see inventory items." />}
                  </div>
                </section>
              )}

              {tab === "purchases" && <TransactionTable title="Purchase History" subtitle={`${purchases.length} purchase record(s)`} rows={purchases} columns={["Date", "Item", "Qty", "Unit Price", "Total", "Supplier", "Invoice", "Added By"]} row={(tx) => [dateTime(tx.created_at || tx.purchase_date), tx.item_name || tx.item_id || "—", `${qty(tx.quantity)} ${tx.unit || ""}`, money(tx.unit_price), money(tx.total_cost), tx.supplier || tx.vendor || "—", tx.invoice_number || "—", tx.performed_by || "Chef"]} empty="No purchases have been recorded yet." />}
              {tab === "consumption" && <TransactionTable title="Kitchen Consumption" subtitle={`${consumption.length} consumption record(s)`} rows={consumption} columns={["Date", "Item", "Used", "Unit", "Order / Batch", "Notes", "By"]} row={(tx) => [dateTime(tx.created_at || tx.date_time), tx.item_name || tx.item_id || "—", qty(tx.quantity_used), tx.unit || "", tx.related_order || "Production", tx.notes || "—", tx.performed_by || "Chef"]} empty="No kitchen consumption records have been recorded yet." />}
              {tab === "wastage" && <TransactionTable title="Wastage Register" subtitle={`${wastage.length} wastage record(s)`} rows={wastage} columns={["Date", "Item", "Wasted", "Unit", "Reason", "Notes", "By"]} row={(tx) => [dateTime(tx.created_at || tx.date), tx.item_name || tx.item_id || "—", qty(tx.quantity), tx.unit || "", tx.reason || "—", tx.notes || "—", tx.performed_by || "Chef"]} empty="No wastage records have been recorded yet." />}

              {tab === "requirements" && (
                <section className="space-y-4">
                  <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                    <div><h2 className="text-lg font-black text-slate-950 dark:text-white">Low Stock & Purchase Requirements</h2><p className="mt-1 text-xs leading-5 text-slate-400">Create and track requests for ingredients below their minimum levels.</p></div>
                    {canManage && <button onClick={() => openRequirement()} className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black"><Plus className="h-4 w-4" /> New Requirement</button>}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {items.filter((item) => item.status !== "In Stock").map((item) => {
                      const shortage = Math.max(0, item.minimum_level - item.current_stock);
                      const priority = item.current_stock <= 0 ? "Critical" : item.current_stock < item.minimum_level * 0.5 ? "High" : "Normal";
                      return (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-950 dark:text-white">{item.name}</h3><p className="mt-1 text-xs text-slate-400">{item.category} · Current {qty(item.current_stock)} {item.unit}</p></div><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${priorityTone(priority)}`}>{priority}</span></div>
                          <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950/60"><Metric label="Minimum" value={`${qty(item.minimum_level)} ${item.unit}`} /><Metric label="Shortage" value={`${qty(shortage)} ${item.unit}`} strong /></div>
                          {canManage && <button onClick={() => openRequirement(item)} className="btn-secondary mt-3 w-full py-2.5 text-xs font-black">Create Requirement</button>}
                        </div>
                      );
                    })}
                    {items.filter((item) => item.status !== "In Stock").length === 0 && <div className="md:col-span-2 xl:col-span-3"><EmptyState title="Stock levels look healthy" text="No ingredient currently falls below its minimum stock level." /></div>}
                  </div>

                  <RequirementTable rows={requirements} canManage={mode === "admin"} onStatusChange={setRequirementStatus} />
                </section>
              )}

              {tab === "audit" && <AuditTimeline rows={auditRows} />}
            </div>

        {canManage && showPurchase && (
          <Modal title="Add Kitchen Purchase" subtitle="Increase stock and create a traceable purchase record." onClose={() => setShowPurchase(false)}>
            <form onSubmit={savePurchase} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Item Name *"><input className="custom-input" value={purchaseForm.item_name} onChange={(event) => setPurchaseForm((form) => ({ ...form, item_name: event.target.value }))} placeholder="e.g. Tomato" required /></Field>
                <Field label="Category *"><CustomSelect value={purchaseForm.category} onChange={(value) => setPurchaseForm((form) => ({ ...form, category: value }))} options={categoryOptions} placeholder="Select category" searchable /></Field>
                <Field label="Quantity *"><input type="number" min="0.001" step="0.001" className="custom-input" value={purchaseForm.quantity} onChange={(event) => setPurchaseForm((form) => ({ ...form, quantity: event.target.value }))} placeholder="20" required /></Field>
                <Field label="Unit *"><CustomSelect value={purchaseForm.unit} onChange={(value) => setPurchaseForm((form) => ({ ...form, unit: value }))} options={unitOptions} placeholder="Select unit" /></Field>
                <Field label="Unit Price *"><input type="number" min="0" step="0.01" className="custom-input" value={purchaseForm.unit_price} onChange={(event) => setPurchaseForm((form) => ({ ...form, unit_price: event.target.value }))} placeholder="40.00" required /></Field>
                <Field label="Total Cost"><div className="flex min-h-[46px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-black text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">{money(Number(purchaseForm.quantity || 0) * Number(purchaseForm.unit_price || 0))}</div></Field>
                <Field label="Minimum Stock Level"><input type="number" min="0" step="0.001" className="custom-input" value={purchaseForm.minimum_level} onChange={(event) => setPurchaseForm((form) => ({ ...form, minimum_level: event.target.value }))} placeholder="10" /></Field>
                <Field label="Supplier / Vendor"><input className="custom-input" value={purchaseForm.supplier} onChange={(event) => setPurchaseForm((form) => ({ ...form, supplier: event.target.value }))} placeholder="Supplier name" /></Field>
                <Field label="Purchase Date"><input type="date" className="custom-input" value={purchaseForm.purchase_date} onChange={(event) => setPurchaseForm((form) => ({ ...form, purchase_date: event.target.value }))} /></Field>
                <Field label="Invoice / Bill Number"><input className="custom-input" value={purchaseForm.invoice_number} onChange={(event) => setPurchaseForm((form) => ({ ...form, invoice_number: event.target.value }))} placeholder="INV-1001" /></Field>
              </div>
              <Field label="Bill / Invoice Image"><input type="file" accept="image/*,.pdf" className="custom-input py-2" onChange={(event) => handleBillImage(event.target.files?.[0])} /><p className="mt-1 text-[11px] text-slate-400">Optional · maximum 1.5 MB</p></Field>
              <Field label="Notes"><textarea className="custom-input min-h-24" value={purchaseForm.notes} onChange={(event) => setPurchaseForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Add purchase notes..." /></Field>
              <ModalActions saving={saving} close={() => setShowPurchase(false)} />
            </form>
          </Modal>
        )}

        {canManage && showUsage && (
          <Modal title="Record Stock Usage / Consumption" subtitle="Log ingredients used in kitchen production." onClose={() => setShowUsage(false)}>
            <form onSubmit={saveUsage} className="space-y-5">
              <Field label="Item *"><CustomSelect value={usageForm.item_id} onChange={(value) => { const item = items.find((entry) => entry.id === value); setUsageForm((form) => ({ ...form, item_id: value, unit: item?.unit || form.unit })); }} options={itemOptions} placeholder={items.length ? "Select an inventory item" : "No inventory items available"} searchable disabled={items.length === 0} /></Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Quantity Used *"><input type="number" min="0.001" step="0.001" className="custom-input" value={usageForm.quantity_used} onChange={(event) => setUsageForm((form) => ({ ...form, quantity_used: event.target.value }))} placeholder="2.5" required /></Field>
                <Field label="Date & Time"><input type="datetime-local" className="custom-input" value={usageForm.date_time} onChange={(event) => setUsageForm((form) => ({ ...form, date_time: event.target.value }))} /></Field>
              </div>
              <Field label="Related Order / Production Batch"><input className="custom-input" value={usageForm.related_order} onChange={(event) => setUsageForm((form) => ({ ...form, related_order: event.target.value }))} placeholder="ORD-1001 or Lunch Batch" /></Field>
              <Field label="Notes"><textarea className="custom-input min-h-24" value={usageForm.notes} onChange={(event) => setUsageForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Optional kitchen notes..." /></Field>
              <ModalActions saving={saving} close={() => setShowUsage(false)} />
            </form>
          </Modal>
        )}

        {canManage && showWastage && (
          <Modal title="Record Ingredient Wastage" subtitle="Track spoiled, damaged or preparation waste separately from consumption." onClose={() => setShowWastage(false)}>
            <form onSubmit={saveWastage} className="space-y-5">
              <Field label="Item *"><CustomSelect value={wastageForm.item_id} onChange={(value) => setWastageForm((form) => ({ ...form, item_id: value }))} options={itemOptions} placeholder={items.length ? "Select an inventory item" : "No inventory items available"} searchable disabled={items.length === 0} /></Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Wasted Quantity *"><input type="number" min="0.001" step="0.001" className="custom-input" value={wastageForm.quantity} onChange={(event) => setWastageForm((form) => ({ ...form, quantity: event.target.value }))} placeholder="1" required /></Field>
                <Field label="Reason *"><CustomSelect value={wastageForm.reason} onChange={(value) => setWastageForm((form) => ({ ...form, reason: value }))} options={reasonOptions} placeholder="Select a reason" /></Field>
              </div>
              <Field label="Date"><input type="date" className="custom-input" value={wastageForm.date} onChange={(event) => setWastageForm((form) => ({ ...form, date: event.target.value }))} /></Field>
              <Field label="Notes"><textarea className="custom-input min-h-24" value={wastageForm.notes} onChange={(event) => setWastageForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Explain the wastage if useful..." /></Field>
              <ModalActions saving={saving} close={() => setShowWastage(false)} />
            </form>
          </Modal>
        )}

        {canManage && showAdjustment && (
          <Modal title="Manual Stock Adjustment" subtitle="Use this only for verified stock-count corrections." onClose={() => setShowAdjustment(false)}>
            <form onSubmit={saveAdjustment} className="space-y-5">
              <Field label="Item *"><CustomSelect value={adjustmentForm.item_id} onChange={(value) => setAdjustmentForm((form) => ({ ...form, item_id: value }))} options={itemOptions} placeholder={items.length ? "Select an inventory item" : "No inventory items available"} searchable disabled={items.length === 0} /></Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Adjustment Quantity *"><input type="number" step="0.001" className="custom-input" value={adjustmentForm.quantity_delta} onChange={(event) => setAdjustmentForm((form) => ({ ...form, quantity_delta: event.target.value }))} placeholder="+5 or -2" required /></Field>
                <Field label="Reference"><input className="custom-input" value={adjustmentForm.reference} onChange={(event) => setAdjustmentForm((form) => ({ ...form, reference: event.target.value }))} placeholder="Stock count / correction" /></Field>
              </div>
              <Field label="Reason *"><textarea className="custom-input min-h-24" value={adjustmentForm.reason} onChange={(event) => setAdjustmentForm((form) => ({ ...form, reason: event.target.value }))} required /></Field>
              <ModalActions saving={saving} close={() => setShowAdjustment(false)} submitText="Adjust Stock" />
            </form>
          </Modal>
        )}

        {canManage && showRequirement && (
          <Modal title="Create Purchase Requirement" subtitle="Send a traceable stock requirement to Admin for approval." onClose={() => setShowRequirement(false)}>
            <form onSubmit={saveRequirement} className="space-y-5">
              <Field label="Item *"><CustomSelect value={reqForm.item_id} onChange={(value) => { const item = items.find((entry) => entry.id === value); const shortage = item ? Math.max(0, item.minimum_level - item.current_stock) : 0; const priority = item && item.current_stock <= 0 ? "Critical" : item && item.current_stock < item.minimum_level * 0.5 ? "High" : "Normal"; setReqForm((form) => ({ ...form, item_id: value, unit: item?.unit || form.unit, required_quantity: shortage ? String(shortage) : form.required_quantity, priority })); }} options={itemOptions.map((option) => ({ label: option.label, value: option.value }))} placeholder={items.length ? "Select an inventory item" : "No inventory items available"} searchable disabled={items.length === 0} /></Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Required Quantity *"><input type="number" min="0.001" step="0.001" className="custom-input" value={reqForm.required_quantity} onChange={(event) => setReqForm((form) => ({ ...form, required_quantity: event.target.value }))} placeholder="8" required /></Field>
                <Field label="Priority"><CustomSelect value={reqForm.priority} onChange={(value) => setReqForm((form) => ({ ...form, priority: value }))} options={priorityOptions} placeholder="Select priority" /></Field>
              </div>
              <Field label="Reason *"><input className="custom-input" value={reqForm.reason} onChange={(event) => setReqForm((form) => ({ ...form, reason: event.target.value }))} placeholder="Below minimum stock" required /></Field>
              <Field label="Notes"><textarea className="custom-input min-h-24" value={reqForm.notes} onChange={(event) => setReqForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Optional details for Admin..." /></Field>
              <ModalActions saving={saving} close={() => setShowRequirement(false)} submitText="Send to Admin" />
            </form>
          </Modal>
        )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">{label}</span>{children}</label>;
}

function ModalActions({ saving, close, submitText = "Save" }: { saving: boolean; close: () => void; submitText?: string }) {
  return <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end"><button type="button" onClick={close} className="btn-secondary px-4 py-2.5 text-xs font-black">Cancel</button><button type="submit" disabled={saving} className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black">{saving && <RefreshCw className="h-4 w-4 animate-spin" />}{saving ? "Saving..." : submitText}</button></div>;
}

function Modal({ title, subtitle, children, onClose }: { title: string; subtitle?: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5"><div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"><div className="shrink-0 border-b border-slate-100 bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>{subtitle && <p className="mt-1 text-xs leading-5 text-slate-400">{subtitle}</p>}</div><button onClick={onClose} aria-label="Close dialog" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"><X className="h-5 w-5" /></button></div></div><div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div></div></div>;
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"><div className="text-[10px] font-semibold text-slate-400">{label}</div><div className={`mt-1 ${strong ? "font-black text-slate-950 dark:text-white" : "font-bold text-slate-700 dark:text-slate-200"}`}>{value}</div></div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"><Archive className="h-5 w-5" /></div><h3 className="mt-3 text-sm font-black text-slate-950 dark:text-white">{title}</h3><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">{text}</p></div>;
}

function TransactionTable({ title, subtitle, rows, columns, row, empty }: { title: string; subtitle: string; rows: Tx[]; columns: string[]; row: (tx: Tx) => React.ReactNode[]; empty: string }) {
  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="border-b border-slate-100 p-5 dark:border-slate-800"><h2 className="text-lg font-black text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-xs text-slate-400">{subtitle}</p></div>{rows.length === 0 ? <EmptyState title={title === "Purchase History" ? "No purchase records" : "No records found"} text={empty} /> : <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[950px] text-left text-xs"><thead className="bg-slate-50 dark:bg-slate-950/60"><tr>{columns.map((column) => <th key={column} className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">{column}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.slice(0, 500).map((tx, index) => <tr key={tx.id || index} className="hover:bg-slate-50/70 dark:hover:bg-slate-950/40">{row(tx).map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3.5 align-top text-slate-700 dark:text-slate-200">{cell}</td>)}</tr>)}</tbody></table></div><div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">{rows.slice(0, 250).map((tx, index) => { const cells = row(tx); return <article key={tx.id || index} className="p-4"><div className="flex items-start justify-between gap-3"><div className="text-xs font-black text-slate-950 dark:text-white">{cells[1]}</div><div className="text-[10px] text-slate-400">{cells[0]}</div></div><div className="mt-3 space-y-2">{cells.slice(2).map((cell, cellIndex) => <div key={cellIndex} className="flex items-start justify-between gap-3 text-xs"><span className="text-slate-400">{columns[cellIndex + 2]}</span><span className="text-right font-semibold text-slate-700 dark:text-slate-200">{cell}</span></div>)}</div></article>; })}</div></>}</section>;
}

function RequirementTable({ rows, canManage, onStatusChange }: { rows: Tx[]; canManage: boolean; onStatusChange: (id: string, status: string) => void }) {
  if (rows.length === 0) return <EmptyState title="No purchase requirements" text="Requirements created by Chef will appear here for Admin review." />;
  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="border-b border-slate-100 p-5 dark:border-slate-800"><h2 className="text-lg font-black text-slate-950 dark:text-white">Purchase Requirements</h2><p className="mt-1 text-xs text-slate-400">Review request history and update approval status.</p></div><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[980px] text-left text-xs"><thead className="bg-slate-50 dark:bg-slate-950/60"><tr>{["Date", "Item", "Required", "Priority", "Reason", "Requested By", "Status", "Action"].map((head) => <th key={head} className="px-4 py-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map((row, index) => <tr key={row.id || index}><td className="px-4 py-3.5">{dateTime(row.request_date)}</td><td className="px-4 py-3.5"><div className="font-black">{row.item_name || row.item_id}</div><div className="text-[10px] text-slate-400">{row.unit || ""}</div></td><td className="px-4 py-3.5 font-bold">{qty(row.required_quantity)} {row.unit || ""}</td><td className="px-4 py-3.5"><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${priorityTone(row.priority)}`}>{row.priority || "Normal"}</span></td><td className="max-w-[240px] px-4 py-3.5">{row.reason || "—"}</td><td className="px-4 py-3.5">{row.requested_by || "Chef"}</td><td className="px-4 py-3.5"><span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{row.status || "Pending"}</span></td><td className="px-4 py-3.5">{canManage && <CustomSelect value={row.status || "Pending"} onChange={(status) => onStatusChange(row.id, status)} options={optionize(REQUIREMENT_STATUSES)} className="min-w-[150px]" />}</td></tr>)}</tbody></table></div><div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">{rows.map((row, index) => <article key={row.id || index} className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-950 dark:text-white">{row.item_name || row.item_id}</h3><p className="mt-1 text-[10px] text-slate-400">{dateTime(row.request_date)} · {row.requested_by || "Chef"}</p></div><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${priorityTone(row.priority)}`}>{row.priority || "Normal"}</span></div><div className="mt-4 grid grid-cols-2 gap-2.5"><Metric label="Required" value={`${qty(row.required_quantity)} ${row.unit || ""}`} strong /><Metric label="Status" value={row.status || "Pending"} /><Metric label="Reason" value={row.reason || "—"} /><Metric label="Updated By" value={row.updated_by || "—"} /></div>{canManage && <CustomSelect value={row.status || "Pending"} onChange={(status) => onStatusChange(row.id, status)} options={optionize(REQUIREMENT_STATUSES)} className="mt-3" />}</article>)}</div></section>;
}

function AuditTimeline({ rows }: { rows: Tx[] }) {
  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="border-b border-slate-100 p-5 dark:border-slate-800"><h2 className="text-lg font-black text-slate-950 dark:text-white">Inventory Audit Trail</h2><p className="mt-1 text-xs text-slate-400">Chronological, traceable stock activity.</p></div>{rows.length === 0 ? <EmptyState title="No audit records" text="Inventory actions will appear here as purchases, usage, wastage and adjustments are recorded." /> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{rows.slice(0, 500).map((row, index) => <article key={row.id || index} className="p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">{row.action === "PURCHASE" ? <ArrowDownCircle className="h-4 w-4" /> : row.action === "WASTAGE" ? <Trash2 className="h-4 w-4" /> : row.action === "CONSUMPTION" ? <ArrowUpCircle className="h-4 w-4" /> : <History className="h-4 w-4" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black text-slate-950 dark:text-white">{row.action || "AUDIT"}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{row.item || "—"}</span></div><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{row.reason || "No reason provided"} · Ref: {row.reference || "—"}</p></div></div><div className="sm:text-right"><div className={`text-xs font-black ${Number(row.quantity || 0) < 0 ? "text-rose-600 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"}`}>{row.quantity !== undefined ? `${Number(row.quantity) > 0 ? "+" : ""}${qty(row.quantity)}${row.item ? "" : ""}` : ""}</div><div className="mt-1 text-[10px] text-slate-400">{dateTime(row.timestamp)} · {row.performed_by || "Staff"}</div></div></div></article>)}</div>}</section>;

}
