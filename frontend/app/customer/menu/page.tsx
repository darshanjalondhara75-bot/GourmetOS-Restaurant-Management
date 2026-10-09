"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  getCategories, getMenuItems, getCart, addToCart as addToServerCart,
  updateCartItem as updateServerCartItem, checkoutCart, validateMenuSession,
  createOnlinePaymentOrder, verifyOnlinePayment,
  createCategory, deleteCategory, createMenuItem, updateMenuItem, deleteMenuItem,
  MenuCategory, MenuItem
} from "@/lib/api";
import { triggerRazorpayOrderPayment } from "@/lib/razorpay";
import { useAuth } from "@/lib/authContext";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";
import {
  Utensils,
  Search,
  AlertCircle,
  Leaf,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  X,
  QrCode,
  ChefHat,
  CheckCircle2,
  Edit3
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BRAND_NAME } from "@/lib/branding";
import { PageWrapper } from "@/components/PageWrapper";
import { CustomSelect } from "@/components/CustomSelect";
import { USD_TO_INR_RATE, usdToInr } from "@/lib/currency";

const TABLE_SESSION_KEY = "gourmetos_locked_table";

export default function CustomerMenuPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isChef = user?.role === "chef";

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);
  const menuLoadRequest = useRef<Promise<void> | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [tableLockMessage, setTableLockMessage] = useState<string | null>(null);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number; notes: string }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Online" | "At Counter">("At Counter");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionMessage, setSessionMessage] = useState("");

  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  const [showDishModal, setShowDishModal] = useState(false);
  const [dishName, setDishName] = useState("");
  const [dishCat, setDishCat] = useState("");
  const [dishPrice, setDishPrice] = useState("");
  const [dishDesc, setDishDesc] = useState("");
  const [dishImg, setDishImg] = useState("");
  const [dishIsVeg, setDishIsVeg] = useState(true);
  const [dishIsAvailable, setDishIsAvailable] = useState(true);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [savingDish, setSavingDish] = useState(false);
  const [chefSuccess, setChefSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    const initializeSession = async () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const tid = params.get("tableId");
      if (!tid) return;

      if (user?.role === "user") {
        setTableLockMessage(null);
        setTableNumber(tid);
        setSessionReady(false);
        setSessionEnded(false);
        const tokenFromUrl = params.get("token");
        try {
          if (!tokenFromUrl) {
            setSessionEnded(true);
            setSessionMessage("Scan the table QR code from your booking. The one-time token is in that URL.");
            setCart([]);
            return;
          }
          const session = await validateMenuSession(tokenFromUrl, tid);
          if (!session.active) {
            setSessionToken(tokenFromUrl);
            setSessionEnded(true);
            setSessionMessage(session.message || "This dining session has ended. Please book a new table for another order.");
            setCart([]);
            return;
          }
          setSessionToken(tokenFromUrl);
          setCustomerName(session.customer_name || "");
          setSessionMessage("");
          setSessionEnded(false);
          setSessionReady(true);
          await loadTableCart(tid, tokenFromUrl);
        } catch (error) {
          setSessionReady(false);
          setSessionEnded(true);
          setSessionMessage(error instanceof Error ? error.message : "Book this table first to start your dining session.");
          setCart([]);
        }
        return;
      }

      const lockedTable = sessionStorage.getItem(TABLE_SESSION_KEY);
      const activeTable = lockedTable || tid;
      if (!lockedTable) sessionStorage.setItem(TABLE_SESSION_KEY, tid);
      else if (lockedTable !== tid) {
        params.set("tableId", lockedTable);
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
        setTableLockMessage(`This session is locked to Table #${lockedTable}.`);
      }
      setTableNumber(activeTable);
    };

    initializeSession();
  }, [user]);

  const loadMenu = async () => {
    if (menuLoadRequest.current) return menuLoadRequest.current;

    const request = (async () => {
      try {
        const [categoriesResult, itemsResult] = await Promise.allSettled([
          getCategories(),
          getMenuItems(),
        ]);
        if (itemsResult.status === "rejected") {
          throw itemsResult.reason;
        }

        const items = itemsResult.value;
        const cats = categoriesResult.status === "fulfilled"
          ? categoriesResult.value
          : [...new Set(items.map((item) => item.category))]
            .sort((first, second) => first.localeCompare(second))
            .map((name, index) => ({
              id: `menu-category-${index}`,
              name,
              icon: "utensils",
              sort_order: index,
            }));
        if (categoriesResult.status === "rejected") {
          console.warn("Menu categories could not be loaded; deriving filters from available dishes.", categoriesResult.reason);
        }

        setCategories(cats);
        setMenuItems(items);
        setMenuLoadError(null);
        setDishCat((prev) => prev || cats[0]?.name || "");
      } catch (err) {
        console.warn("Menu could not be loaded.", err);
        setMenuLoadError(err instanceof Error ? err.message : "Unable to load the menu.");
      } finally {
        setMenuLoading(false);
      }
    })();
    menuLoadRequest.current = request;

    try {
      await request;
    } finally {
      if (menuLoadRequest.current === request) {
        menuLoadRequest.current = null;
      }
    }
  };

  useRealtimeUpdates(loadMenu, ["menu"]);

  const showChefSuccess = (msg: string) => {
    setChefSuccess(msg);
    setTimeout(() => setChefSuccess(null), 3000);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    try {
      const newCat = await createCategory({ name: catName.trim(), sort_order: categories.length + 1 });
      setCatName("");
      setShowCatModal(false);
      showChefSuccess(`Category "${newCat.name}" added!`);
      await loadMenu();
    } catch (err: any) {
      alert(err.message || "Failed to create category.");
    } finally {
      setSavingCat(false);
    }
  };

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDish(true);
    try {
      const dishData = {
        name: dishName.trim(),
        category: dishCat,
        price: Number(dishPrice),
        description: dishDesc.trim(),
        image_url: dishImg.trim() || undefined,
        is_veg: dishIsVeg,
        is_available: editingDishId ? dishIsAvailable : true,
      };
      if (editingDishId) {
        await updateMenuItem(editingDishId, dishData);
      } else {
        await createMenuItem(dishData);
      }
      setDishName(""); setDishPrice(""); setDishDesc(""); setDishImg(""); setDishIsVeg(true); setDishIsAvailable(true);
      setEditingDishId(null);
      setShowDishModal(false);
      showChefSuccess(editingDishId ? `"${dishName}" updated.` : `"${dishName}" added to menu!`);
      await loadMenu();
    } catch (err: any) {
      alert(err.message || "Failed to add dish.");
    } finally {
      setSavingDish(false);
    }
  };

  const openEditDish = (item: MenuItem) => {
    setEditingDishId(item.id);
    setDishName(item.name);
    setDishCat(item.category);
    setDishPrice(item.price.toString());
    setDishDesc(item.description);
    setDishImg(item.image_url);
    setDishIsVeg(item.is_veg);
    setDishIsAvailable(item.is_available);
    setShowDishModal(true);
  };

  const handleDeleteCategory = async (category: MenuCategory) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
      await deleteCategory(category.id);
      if (selectedCat === category.name) setSelectedCat("All");
      showChefSuccess(`Category "${category.name}" deleted.`);
      await loadMenu();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete category.");
    }
  };

  const handleDeleteDish = async (item: MenuItem) => {
    if (!confirm(`Delete dish "${item.name}"?`)) return;
    try {
      await deleteMenuItem(item.id);
      showChefSuccess(`"${item.name}" deleted from menu.`);
      await loadMenu();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete dish.");
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await updateMenuItem(item.id, { is_available: !item.is_available });
      showChefSuccess(`"${item.name}" is now ${item.is_available ? "out of stock" : "in stock"}.`);
      await loadMenu();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update stock status.");
    }
  };

  const endSessionFromError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "";
    if (/session|token|ended|expired/i.test(message)) {
      setSessionEnded(true);
      setSessionReady(false);
      setSessionMessage(message || "This dining session has ended.");
      return true;
    }
    return false;
  };

  const loadTableCart = async (table: string, token: string) => {
    try {
      const serverCart = await getCart(table, token);
      const loadedCart = serverCart.items.map((cartItem) => ({
        item: menuItems.find((item) => item.id === cartItem.item_id) || {
          id: cartItem.item_id,
          name: cartItem.name,
          category: "General",
          price: cartItem.price,
          description: "",
          image_url: cartItem.image_url || "",
          is_veg: true,
          is_available: true
        },
        quantity: cartItem.quantity,
        notes: cartItem.notes || ""
      }));
      setCart(loadedCart);
    } catch (err) {
      if (!endSessionFromError(err)) console.warn("Table cart load warning:", err);
    }
  };

  const addToCart = async (item: MenuItem) => {
    if (!tableNumber || !sessionToken || sessionEnded) return;
    setCart((current) => {
      const existing = current.find((entry) => entry.item.id === item.id);
      if (existing) {
        return current.map((entry) => entry.item.id === item.id
          ? { ...entry, quantity: entry.quantity + 1 }
          : entry);
      }
      return [...current, { item, quantity: 1, notes: "" }];
    });
    await addToServerCart(tableNumber, item.id, 1, "", sessionToken).catch((error) => {
      endSessionFromError(error);
    });
  };

  const updateQuantity = async (itemId: string, delta: number) => {
    if (!tableNumber || !sessionToken || sessionEnded) return;
    const current = cart.find((entry) => entry.item.id === itemId);
    if (!current) return;
    const quantity = current.quantity + delta;
    setCart((entries) => quantity > 0
      ? entries.map((entry) => entry.item.id === itemId ? { ...entry, quantity } : entry)
      : entries.filter((entry) => entry.item.id !== itemId));
    await updateServerCartItem(tableNumber, itemId, quantity, undefined, sessionToken);
  };

  const removeItem = async (itemId: string) => {
    if (!tableNumber || !sessionToken || sessionEnded) return;
    setCart((entries) => entries.filter((entry) => entry.item.id !== itemId));
    await updateServerCartItem(tableNumber, itemId, 0, undefined, sessionToken);
  };

  const cartTotal = cart.reduce((total, entry) => total + entry.item.price * entry.quantity, 0);
  const cartItemCount = cart.reduce((total, entry) => total + entry.quantity, 0);

  const handleCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tableNumber || !sessionToken || sessionEnded || cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const order = await checkoutCart(tableNumber, customerName, specialInstructions, sessionToken, paymentMethod);
      setCart([]);
      setIsCartOpen(false);
      setSessionEnded(true);
      setSessionReady(false);
      const trackerUrl = `/customer/order-status/${encodeURIComponent(order.order_id)}`;
      let paymentErrorQuery = "";
      if (paymentMethod === "Online") {
        try {
          const paymentSetup = await createOnlinePaymentOrder(order.order_id);
          if (!paymentSetup.available) {
            try {
              sessionStorage.setItem(`gourmetos-payment-error:${order.order_id}`, paymentSetup.message);
            } catch {
              paymentErrorQuery = `?paymentError=${encodeURIComponent(paymentSetup.message)}`;
            }
          } else {
            const payment = await triggerRazorpayOrderPayment(
              paymentSetup.order,
              user?.name || customerName,
              user?.email || "",
            );
            if (payment) {
              const pendingKey = `gourmetos-pending-payment:${order.order_id}`;
              sessionStorage.setItem(pendingKey, JSON.stringify(payment));
              await verifyOnlinePayment(order.order_id, payment);
              sessionStorage.removeItem(pendingKey);
            }
          }
        } catch (paymentError) {
          const message = paymentError instanceof Error
            ? paymentError.message
            : "Online payment did not finish. You can pay at the restaurant counter.";
          try {
            sessionStorage.setItem(`gourmetos-payment-error:${order.order_id}`, message);
          } catch {
            paymentErrorQuery = `?paymentError=${encodeURIComponent(message)}`;
          }
        }
      }
      router.push(`${trackerUrl}${paymentErrorQuery}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCat = selectedCat === "All" || item.category.toLowerCase() === selectedCat.toLowerCase();
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg = vegOnly ? item.is_veg : true;
    return matchesCat && matchesQuery && matchesVeg;
  });
  const unavailableSearchItems = filteredItems.filter((item) => !item.is_available);

  return (
    <PageWrapper>
      <div className="menu-shell min-h-screen bg-[#f7f8fc] text-slate-900 pb-24">
      {/* Top Customer Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight break-words">{BRAND_NAME} Dining</h1>
              {tableNumber && (
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-indigo-600 font-bold">
                  <QrCode className="w-3 h-3" />
                  <span className="truncate">Table #{tableNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {isChef && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={(e) => { e.preventDefault(); setShowCatModal(true); }}
                  className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 transition"
                  title="Add new category"
                >
                  <Plus className="w-3 h-3" /> <span className="hidden xs:inline">Category</span>
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); setEditingDishId(null); setDishCat(categories[0]?.name || ""); setShowDishModal(true); }}
                  disabled={categories.length === 0}
                  className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                  title="Add new dish"
                >
                  <ChefHat className="w-3 h-3" /> <span className="hidden xs:inline">Add Dish</span>
                </button>
              </div>
            )}

            {tableNumber && sessionReady && !sessionEnded && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative btn-primary py-1.5 px-2.5 sm:py-2 sm:px-3.5 text-[10px] sm:text-xs font-bold flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">View Cart</span>
                {cartItemCount > 0 && (
                  <span className="ml-1 bg-white text-indigo-600 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {chefSuccess && (
          <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {chefSuccess}
          </div>
        )}
        {tableLockMessage && (
          <div className="mt-2 flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl" role="status">
            <QrCode className="w-4 h-4 flex-shrink-0" />
            {tableLockMessage}
          </div>
        )}
      </header>

      {tableNumber && user?.role === "user" && sessionEnded && (
        <div className="max-w-3xl mx-auto w-full p-4 sm:p-6">
          <div className="rounded-3xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900/60 p-6 sm:p-8 text-center shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 mb-4"><AlertCircle className="w-7 h-7" /></div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600">Dining Session Closed</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">Session Ended</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xl mx-auto">{sessionMessage || "This QR session can only be used once. After placing your order, the token expires."}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button onClick={() => router.push("/user/table-booking")} className="btn-primary px-4 py-2.5 text-xs font-black">Book Another Table</button>
              <button onClick={() => router.push("/user/orders")} className="btn-secondary px-4 py-2.5 text-xs font-black">View My Orders</button>
            </div>
          </div>
        </div>
      )}

      {!tableNumber && user?.role === "user" && (
        <div className="max-w-3xl mx-auto w-full p-4 sm:p-6">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-900/60 p-5 text-center">
            <QrCode className="w-7 h-7 text-indigo-600 mx-auto mb-2" />
            <h2 className="font-black text-slate-900 dark:text-slate-100">Book a table to place an order</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Customer ordering is secured to a booked table and one-time session token.</p>
            <button onClick={() => router.push("/user/table-booking")} className="btn-primary mt-4 text-xs font-black px-4 py-2.5">Open Table Booking</button>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden border border-indigo-400/30">
          <div className="relative z-10">
            <span className="badge bg-white/20 text-white border-white/30 mb-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              ✨ Freshly Prepared Dishes
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight break-words">
              {tableNumber ? "Order Directly From Your Table" : "Explore Our Menu"}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 mt-2 font-medium max-w-md leading-relaxed break-words">
              {tableNumber
                ? "Browse our chef-crafted menu, add items to your cart, and send your order straight to the kitchen."
                : "Browse our chef-crafted menu and discover your next favorite dish."}
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="max-w-7xl mx-auto px-4 space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                className="custom-input pl-10 bg-white"
                placeholder="Search delicious dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 whitespace-nowrap ${
              vegOnly
                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Leaf className="w-3.5 h-3.5" /> Pure Veg
          </button>
        </div>

        {searchQuery.trim() && unavailableSearchItems.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700" role="status">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="break-words">
              {unavailableSearchItems.length === 1
                ? `"${unavailableSearchItems[0].name}" is currently not available.`
                : "Some matching menu items are currently not available."}
            </span>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedCat("All")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCat === "All"
                ? "bg-slate-900 text-white shadow-md dark:bg-indigo-600 dark:text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl pr-1 dark:bg-slate-800 dark:border-slate-700">
              <button
                onClick={() => setSelectedCat(c.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCat === c.name
                    ? "bg-slate-900 text-white shadow-md dark:bg-indigo-600 dark:text-white"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {c.name}
              </button>
              {isChef && (
                <button
                  onClick={() => handleDeleteCategory(c)}
                  className="p-1 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400"
                  aria-label={`Delete ${c.name} category`}
                  title={`Delete ${c.name} category`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Menu Item Cards */}
      {menuLoading && filteredItems.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 pb-10" role="status" aria-live="polite" aria-label="Loading menu">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            Loading menu items…
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((item) => (
              <div key={item} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="h-40 animate-pulse rounded-xl bg-slate-100 sm:h-48" />
                <div className="space-y-2 p-2 pt-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredItems.length === 0 && menuLoadError && menuItems.length === 0 ? (
        <div className="mx-auto flex min-h-[260px] max-w-7xl items-center justify-center px-4" role="alert">
          <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-7 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Menu couldn’t load</h2>
              <p className="mt-1 break-words text-sm font-medium text-rose-700">{menuLoadError}</p>
            </div>
            <button type="button" onClick={() => void loadMenu()} className="btn-primary px-4 py-2 text-xs font-bold">
              Try again
            </button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 min-h-[420px] flex items-center justify-center">
          <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-8 py-7 text-center shadow-sm" role="status">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {menuItems.length === 0 ? "No menu items yet" : "No matching dishes"}
              </h2>
              <p className="mt-1 text-sm font-medium text-rose-700">
                {menuItems.length === 0
                  ? "The restaurant menu is currently empty. Please check back soon."
                  : searchQuery.trim() || selectedCat !== "All" || vegOnly
                    ? "Try changing your search or filters to see more dishes."
                    : "No menu items are available right now."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
          const itemInCart = cart.find((entry) => entry.item.id === item.id);
          return (
            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
              <div className="relative h-48 w-full bg-slate-100">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {item.is_veg ? (
                    <span className="badge bg-emerald-500 text-white border-emerald-600 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold">
                      <Leaf className="w-3 h-3" /> Veg
                    </span>
                  ) : (
                    <span className="badge bg-rose-500 text-white border-rose-600 text-[10px] px-2 py-1 rounded-full font-bold">Non-Veg</span>
                  )}
                </div>
                <span className={`absolute top-3 right-3 badge text-[10px] px-2 py-1 rounded-full font-bold ${item.is_available ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                  {item.is_available ? "In Stock" : "Out of Stock"}
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-black text-slate-900 text-base leading-tight break-words">{item.name}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-indigo-600 text-base">${item.price.toFixed(2)}</span>
                    {isChef && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`p-1 rounded-lg ${item.is_available ? "text-emerald-600 hover:bg-emerald-50" : "text-rose-500 hover:bg-rose-50"}`}
                          aria-label={`${item.is_available ? "Mark" : "Restock"} ${item.name}`}
                          title={item.is_available ? "Mark out of stock" : "Mark in stock"}
                        >
                          {item.is_available ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditDish(item)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          aria-label={`Edit ${item.name}`}
                          title={`Edit ${item.name}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDish(item)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          aria-label={`Delete ${item.name}`}
                          title={`Delete ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed break-words">{item.description}</p>
              </div>
              {tableNumber && (
                <div className="p-4 pt-0">
                  {itemInCart ? (
                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl p-1 transition-all">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-9 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-slate-50 transition">
                        <Minus className="w-3.5 h-3.5 text-indigo-700" />
                      </button>
                      <span className="font-extrabold text-indigo-900 text-xs"> {itemInCart.quantity} Added</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-9 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-sm hover:bg-indigo-700 transition">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} disabled={!item.is_available || !sessionReady || sessionEnded} className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1">
                      {!sessionReady || sessionEnded ? "Dining Session Required" : item.is_available ? <><Plus className="w-3.5 h-3.5" /> Add to Table Cart</> : "Currently Sold Out"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}

      {tableNumber && cartItemCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-3 left-3 right-3 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-3 text-white shadow-2xl transition-transform active:scale-95 sm:bottom-6 sm:left-6 sm:right-6 sm:p-4"
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="truncate text-[11px] font-bold sm:text-xs">Table #{tableNumber} Cart ({cartItemCount})</span>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-indigo-400 sm:text-xs">
            View Cart <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      )}

      {tableNumber && isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col overflow-y-auto overscroll-contain bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl animate-slide-in sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="min-w-0">
                <h3 className="font-black text-slate-900 text-lg truncate">Table #{tableNumber} Cart</h3>
                <p className="text-xs text-slate-500">Review items before checkout</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 transition" aria-label="Close cart">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 py-4">
              {cart.map((entry) => (
                <div key={entry.item.id} className="space-y-2 border-b border-slate-100 pb-4">
                  <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2">
                    <div className="row-span-2 h-14 w-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <img
                        src={entry.item.image_url}
                        alt={entry.item.name}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-bold text-slate-900">{entry.item.name}</p>
                      <p className="text-xs font-extrabold text-indigo-600">
                        ${(entry.item.price * entry.quantity).toFixed(2)}
                        {paymentMethod === "Online" && (
                          <span className="ml-1 text-[11px] font-semibold text-slate-500">
                            (≈ ₹{usdToInr(entry.item.price * entry.quantity).toFixed(2)})
                          </span>
                        )}
                      </p>
                    </div>
                    <button onClick={() => removeItem(entry.item.id)} className="justify-self-end p-1.5 text-slate-400 transition hover:text-rose-500" aria-label={`Remove ${entry.item.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="col-start-2 col-end-4 flex items-center justify-end gap-2 justify-self-end rounded-xl bg-slate-100 p-1">
                      <button onClick={() => updateQuantity(entry.item.id, -1)} className="min-h-8 min-w-8 text-slate-600 transition hover:text-indigo-600" aria-label={`Decrease ${entry.item.name}`}>
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black min-w-[20px] text-center">{entry.quantity}</span>
                      <button onClick={() => updateQuantity(entry.item.id, 1)} className="min-h-8 min-w-8 text-slate-600 transition hover:text-indigo-600" aria-label={`Increase ${entry.item.name}`}>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleCheckout} className="pt-4 border-t border-slate-200 space-y-3">
              <div className="space-y-3">
                <div className="input-group">
                  <label className="input-label" htmlFor="customer-name">Customer Name</label>
                  <input
                    id="customer-name"
                    type="text"
                    className="custom-input text-xs"
                    placeholder="Booked customer name"
                    value={customerName}
                    readOnly
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="special-instructions">Special Instructions</label>
                  <textarea
                    id="special-instructions"
                    className="custom-input text-xs min-h-[70px]"
                    placeholder="Any allergies or special requests..."
                    value={specialInstructions}
                    onChange={(event) => setSpecialInstructions(event.target.value)}
                  />
                </div>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-xs font-bold text-slate-700">Payment method</legend>
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${paymentMethod === "At Counter" ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>
                  <input
                    type="radio"
                    name="payment-method"
                    value="At Counter"
                    checked={paymentMethod === "At Counter"}
                    onChange={() => setPaymentMethod("At Counter")}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900">Pay at the restaurant</span>
                    <span className="block text-[11px] text-slate-500">Settle with the cashier after your meal.</span>
                  </span>
                </label>
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${paymentMethod === "Online" ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>
                  <input
                    type="radio"
                    name="payment-method"
                    value="Online"
                    checked={paymentMethod === "Online"}
                    onChange={() => setPaymentMethod("Online")}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900">Pay securely online</span>
                    <span className="block text-[11px] text-slate-500">
                      Razorpay · 1 USD = ₹{USD_TO_INR_RATE} (Total: ₹{usdToInr(cartTotal).toFixed(2)} INR)
                    </span>
                  </span>
                </label>
              </fieldset>
              <div className="flex items-center justify-between font-extrabold text-slate-900 py-3 border-y border-slate-100">
                <div>
                  <span className="text-sm block">Total Amount</span>
                  {paymentMethod === "Online" && (
                    <span className="text-[11px] font-normal text-slate-500">
                      Exchange rate: 1 USD = ₹{USD_TO_INR_RATE.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg text-indigo-600 block">${cartTotal.toFixed(2)}</span>
                  {paymentMethod === "Online" && (
                    <span className="text-xs font-bold text-emerald-600 block">
                      Pay ₹{usdToInr(cartTotal).toFixed(2)} in Razorpay
                    </span>
                  )}
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                {isSubmitting
                  ? "Placing Your Order..."
                  : paymentMethod === "Online"
                  ? <>Place Order & Pay ₹{usdToInr(cartTotal).toFixed(2)} <ArrowRight className="w-4 h-4" /></>
                  : <>Checkout Cart <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== CHEF-ONLY: Add Category Modal ===== */}
      {showCatModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">New Category</h2>
                <p className="text-xs text-slate-500">Appears as a filter tab in the menu</p>
              </div>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="input-group">
                <label className="input-label" htmlFor="menu-cat-name">Category Name</label>
                <input
                  id="menu-cat-name"
                  className="custom-input"
                  placeholder="Seafood, Desserts, Beverages..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCatModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={savingCat} className="btn-primary text-xs">
                  {savingCat ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== CHEF-ONLY: Add Dish Modal ===== */}
      {showDishModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">{editingDishId ? "Edit Dish" : "Add New Dish"}</h2>
                <p className="text-xs text-slate-500">{editingDishId ? "Update this dish on the customer menu" : "Dish will appear on the customer menu instantly"}</p>
              </div>
              <button onClick={() => setShowDishModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDish} className="space-y-4">
              <div className="input-group">
                <label className="input-label" htmlFor="menu-dish-name">Dish Name</label>
                <input
                  id="menu-dish-name"
                  className="custom-input"
                  placeholder="Grilled Salmon, Butter Chicken..."
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <label className="input-label" htmlFor="menu-dish-cat">Category</label>
                  <CustomSelect
                    id="menu-dish-cat"
                    value={dishCat}
                    options={categories.map((c) => ({ label: c.name, value: c.name }))}
                    onChange={(val) => setDishCat(val)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="menu-dish-price">Price ($)</label>
                  <input
                    id="menu-dish-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="custom-input"
                    placeholder="12.99"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="menu-dish-desc">Description</label>
                <textarea
                  id="menu-dish-desc"
                  className="custom-input min-h-[70px]"
                  placeholder="Ingredients and details about the dish..."
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="menu-dish-img">Image URL (optional)</label>
                <input
                  id="menu-dish-img"
                  type="url"
                  className="custom-input"
                  placeholder="https://images.unsplash.com/..."
                  value={dishImg}
                  onChange={(e) => setDishImg(e.target.value)}
                />
              </div>

              {dishImg && (
                <div className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={dishImg}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 transition">
                <input
                  type="checkbox"
                  checked={dishIsVeg}
                  onChange={(e) => setDishIsVeg(e.target.checked)}
                  className="rounded w-4 h-4"
                />
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Leaf className="w-4 h-4 text-emerald-500" />
                  Vegetarian Dish
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 transition">
                <input
                  type="checkbox"
                  checked={dishIsAvailable}
                  onChange={(e) => setDishIsAvailable(e.target.checked)}
                  className="rounded w-4 h-4"
                />
                <span className="text-sm font-bold text-slate-700">
                  {dishIsAvailable ? "In Stock" : "Out of Stock"}
                </span>
              </label>

              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setShowDishModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={savingDish} className="btn-primary text-xs">
                  {savingDish ? (editingDishId ? "Saving..." : "Adding...") : (editingDishId ? "Save Changes" : "Add Dish to Menu")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </PageWrapper>
  );
}
