import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axios";
import { posPrint } from "../utils/posPrint";
import {
  Search, Plus, Minus, Trash2, ChevronDown, X, Clock,
  UtensilsCrossed, ReceiptText, Printer, Check, CreditCard,
  Smartphone, Banknote, RefreshCw, ShoppingBag, User,
  Users, Table2, Layers, AlertCircle, Sparkles, MessageSquare,
  History, ArrowRight, CheckCircle2, FileText, ArrowDownLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ETB = (n) => `ETB ${Number(n || 0).toFixed(2)}`;

// Built-in tables
const ALL_TABLES = [
  ...Array.from({ length: 20 }, (_, i) => ({ id: `T-${i + 1}`, label: `Table ${i + 1}`, section: "Main Hall" })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: `VIP-${i + 1}`, label: `VIP ${i + 1}`, section: "VIP Lounge" })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: `P-${i + 1}`, label: `Patio ${i + 1}`, section: "Outdoor Patio" })),
];

function Toast({ msg, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  const bg = type === "error" ? "#ef4444" : type === "info" ? "#3b82f6" : "#10b981";
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: bg,
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 14,
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        animation: "slideInRight 0.3s ease",
        maxWidth: 360,
      }}
    >
      {msg}
    </div>
  );
}

export default function POS() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState([]);
  const [orderType, setOrderType] = useState("dine_in");
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [waiters, setWaiters] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [editingNoteIdx, setEditingNoteIdx] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ taxRate: 15, currency: "ETB" });
  const [searchQ, setSearchQ] = useState("");

  // Retrieval & Held Order tracking
  const [heldOrderId, setHeldOrderId] = useState(null);
  const [heldOrderNo, setHeldOrderNo] = useState("");
  const [heldOrdersList, setHeldOrdersList] = useState([]);
  const [showRefModal, setShowRefModal] = useState(false);
  const [refSearchQ, setRefSearchQ] = useState("");

  const [showPayModal, setShowPayModal] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showWaiterPicker, setShowWaiterPicker] = useState(false);
  const [tableSectionFilter, setTableSectionFilter] = useState("All");
  const [waiterSearchQ, setWaiterSearchQ] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [placing, setPlacing] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [clock, setClock] = useState(new Date());

  const searchRef = useRef(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Table busy check (table has active held order)
  const isTableBusy = useCallback(
    (tableId) => heldOrdersList.some((o) => o.tableNo === tableId),
    [heldOrdersList]
  );

  // Load products, settings, waiters (both from Users and Employees)
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, settRes, usersRes, empRes] = await Promise.all([
        api.get("/products?limit=500&status=active").catch(() => ({ data: [] })),
        api.get("/settings").catch(() => ({ data: {} })),
        api.get("/users?limit=200").catch(() => ({ data: [] })),
        api.get("/employees?status=Active").catch(() => ({ data: [] })),
      ]);
      const prods = prodRes.data?.products || prodRes.data || [];
      setProducts(prods);
      const cats = ["All", ...new Set(prods.map((p) => p.category || "General").filter(Boolean))];
      setCategories(cats);
      setSettings({
        taxRate: Number(settRes.data?.taxRate ?? 15),
        currency: settRes.data?.currencySymbol || "ETB",
      });

      const allUsers = usersRes.data?.users || usersRes.data || [];
      const allEmployees = Array.isArray(empRes.data) ? empRes.data : [];

      const parsedWaiters = [];
      const seen = new Set();

      // From Employee directory
      allEmployees.forEach((emp) => {
        const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
        if (fullName && !seen.has(fullName.toLowerCase())) {
          seen.add(fullName.toLowerCase());
          parsedWaiters.push({
            _id: emp._id,
            name: fullName,
            role: emp.position || emp.department || "Staff",
            code: emp.employeeId || "",
          });
        }
      });

      // From User accounts
      allUsers.forEach((u) => {
        if (u.name && !seen.has(u.name.toLowerCase())) {
          seen.add(u.name.toLowerCase());
          parsedWaiters.push({
            _id: u._id,
            name: u.name,
            role: u.role || "Staff",
            code: u.username || "",
          });
        }
      });

      // Default quick waiters fallback
      if (parsedWaiters.length === 0) {
        parsedWaiters.push(
          { _id: "w1", name: "Waiter 1", role: "Service Staff" },
          { _id: "w2", name: "Waiter 2", role: "Service Staff" },
          { _id: "w3", name: "Captain", role: "Captain" }
        );
      }
      setWaiters(parsedWaiters);
    } catch (e) {
      showToast("Failed to load POS data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load active held orders
  const loadHeldOrders = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await api.get(`/captain-orders?date=${today}&limit=200`);
      const all = res.data || [];
      // Only open/held/sent_to_kitchen/ready orders
      const active = all.filter((o) => ["held", "open", "sent_to_kitchen", "ready", "billed"].includes(o.status));
      setHeldOrdersList(active);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadData();
    loadHeldOrders();
  }, [loadData, loadHeldOrders]);

  // Computed
  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
  const discountAmt = discountPct > 0 ? Math.round((subtotal * discountPct) / 100 * 100) / 100 : 0;
  const taxable = Math.max(0, subtotal - discountAmt);
  const taxAmt = Math.round((taxable * settings.taxRate) / 100 * 100) / 100;
  const grandTotal = Math.round((taxable + taxAmt + (Number(serviceCharge) || 0)) * 100) / 100;
  const change = Math.max(0, (Number(amountPaid) || 0) - grandTotal);

  const filteredProducts = products.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchQ =
      !searchQ ||
      p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      (p.code || "").toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchQ;
  });

  // Add / modify items in cart
  const addItem = (product) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product === product._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + 1,
          totalPrice: (next[idx].quantity + 1) * next[idx].unitPrice,
        };
        return next;
      }
      return [
        ...prev,
        {
          product: product._id,
          productName: product.name,
          productCode: product.code || "",
          category: product.category || "General",
          parentCategory: product.parentCategory || "FOOD",
          unitPrice: Number(product.sellingPrice) || 0,
          quantity: 1,
          totalPrice: Number(product.sellingPrice) || 0,
          notes: "",
          hasRecipe: (product.ingredients?.length || 0) > 0,
        },
      ];
    });
  };

  const changeQty = (idx, delta) => {
    setItems((prev) => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) {
        next.splice(idx, 1);
        return next;
      }
      next[idx] = { ...next[idx], quantity: newQty, totalPrice: newQty * next[idx].unitPrice };
      return next;
    });
  };

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const saveItemNote = (idx) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], notes: noteText };
      return next;
    });
    setEditingNoteIdx(null);
    setNoteText("");
  };

  // ── RETRIEVE AN ORDER INTO THE SIDEBAR CART ──────────────────────
  const retrieveOrderToSidebar = (order) => {
    setHeldOrderId(order._id);
    setHeldOrderNo(order.orderNo);
    setSelectedTable(order.tableNo || "");
    setOrderType(order.orderType || "dine_in");
    setCustomerName(order.customerName || "");
    setDiscountPct(order.discountPercent || 0);
    setServiceCharge(order.serviceCharge || 0);

    const matchedWaiter = waiters.find((w) => w._id === order.waiter || w.name === order.waiterName);
    setSelectedWaiter(matchedWaiter || (order.waiterName ? { _id: order.waiter, name: order.waiterName } : null));

    const retrievedItems = (order.items || []).map((it) => ({
      product: it.product,
      productName: it.productName,
      productCode: it.productCode || "",
      category: it.category || "General",
      parentCategory: it.parentCategory || "FOOD",
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
      notes: it.notes || "",
    }));

    setItems(retrievedItems);
    setShowRefModal(false);
    showToast(`Order #${order.orderNo} (${order.tableNo || "Table"}) retrieved to cart!`);
  };

  // Release / clear retrieved order
  const releaseRetrievedOrder = () => {
    setHeldOrderId(null);
    setHeldOrderNo("");
    setItems([]);
    setSelectedTable("");
    setSelectedWaiter(null);
    setCustomerName("");
    setDiscountPct(0);
    setServiceCharge(0);
    showToast("Cart cleared. Ready for next order.", "info");
  };

  // ── "ORDER" ACTION: BY DEFAULT PLACES ORDER AS "HELD" ───────────
  const handleOrder = async () => {
    if (!items.length) {
      showToast("Add items to place order", "error");
      return;
    }
    setPlacing(true);
    try {
      const payload = {
        tableNo: selectedTable || "Counter",
        tableLabel: selectedTable || "Counter",
        customerName: customerName || "Guest",
        guestCount: 1,
        orderType,
        waiter: selectedWaiter?._id || null,
        waiterName: selectedWaiter?.name || user?.name || "Staff",
        items: items.map((i) => ({
          product: i.product,
          productName: i.productName,
          productCode: i.productCode || "",
          category: i.category,
          parentCategory: i.parentCategory,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          notes: i.notes || "",
        })),
        discountPercent: discountPct,
        serviceCharge,
        status: "held", // Default status is held as requested
      };

      let savedOrder;
      if (heldOrderId) {
        const res = await api.patch(`/captain-orders/${heldOrderId}`, payload);
        savedOrder = res.data.order;
        showToast(`Order #${savedOrder.orderNo} updated & held for ${selectedTable || "Counter"}!`);
      } else {
        const res = await api.post("/captain-orders", payload);
        savedOrder = res.data.order;
        showToast(`Order #${savedOrder.orderNo} placed & held for ${selectedTable || "Counter"}!`);
      }

      // Print KOT ticket for prep station
      posPrint.printKOT(savedOrder, { businessName: "Baba Roti Café" });

      // Reset cart
      setHeldOrderId(null);
      setHeldOrderNo("");
      setItems([]);
      setDiscountPct(0);
      setServiceCharge(0);
      setCustomerName("");
      loadHeldOrders();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to submit order", "error");
    } finally {
      setPlacing(false);
    }
  };

  // ── "CHECKOUT": CONVERTS TO CASH SALE & DEDUCTS STOCK ────────────
  const placeOrder = async () => {
    if (!items.length) {
      showToast("Add at least one item", "error");
      return;
    }
    if (orderType === "dine_in" && !selectedTable) {
      showToast("Please select a table", "error");
      return;
    }
    setPlacing(true);
    try {
      const payload = {
        orderType,
        tableNo: selectedTable,
        customerName: customerName || "Walk-in Guest",
        waiter: selectedWaiter?._id,
        waiterName: selectedWaiter?.name || "",
        captainOrderRef: heldOrderId || null,
        items: items.map((i) => ({
          product: i.product,
          productName: i.productName,
          productCode: i.productCode,
          category: i.category,
          parentCategory: i.parentCategory,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          notes: i.notes,
        })),
        discountPercent: discountPct,
        serviceCharge,
        paymentMethod: payMethod,
        amountPaid: Number(amountPaid) || grandTotal,
        paymentStatus: "paid",
      };

      const res = await api.post("/pos/orders", payload);
      const savedSale = res.data.order;
      setLastOrder(savedSale);

      // Automatically change captain order status from "held" to "paid" (Cash Sales)
      if (heldOrderId) {
        try {
          await api.patch(`/captain-orders/${heldOrderId}`, {
            status: "paid",
            cashSaleRef: savedSale._id,
          });
        } catch (_) {}
      }

      showToast(`Sale #${savedSale.orderNo} completed & converted to Cash Sales! Stock deducted.`);

      // Print thermal receipt
      posPrint.printReceipt(savedSale, {
        hotelName: "Baba Roti Café",
        taxRate: settings.taxRate,
      });

      // Clear cart
      setHeldOrderId(null);
      setHeldOrderNo("");
      setItems([]);
      setDiscountPct(0);
      setServiceCharge(0);
      setCustomerName("");
      setAmountPaid("");
      setShowPayModal(false);
      loadHeldOrders();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to complete sale", "error");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "linear-gradient(135deg,#0a0f1e 0%,#0d1530 50%,#0f1e45 100%)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <RefreshCw size={36} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#94a3b8", marginTop: 12, fontWeight: 600 }}>Loading POS Terminal...</p>
        </div>
      </div>
    );
  }

  // Filtered reference modal orders
  const filteredRefOrders = heldOrdersList.filter((o) => {
    if (!refSearchQ) return true;
    const q = refSearchQ.toLowerCase();
    return (
      (o.orderNo || "").toLowerCase().includes(q) ||
      (o.tableNo || "").toLowerCase().includes(q) ||
      (o.waiterName || "").toLowerCase().includes(q) ||
      (o.items || []).some((it) => (it.productName || "").toLowerCase().includes(q))
    );
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
        flex: 1,
        minHeight: 0,
        background: "linear-gradient(135deg, #070c1e 0%, #0a1128 50%, #0d173d 100%)",
        color: "#e2e8f0",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideInRight { from { transform: translateX(120%); opacity:0 } to { transform: translateX(0); opacity:1 } }
        @keyframes fadeInUp { from { transform: translateY(12px); opacity:0 } to { transform: translateY(0); opacity:1 } }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4) } 50% { box-shadow: 0 0 0 8px rgba(16,185,129,0) } }
        .product-card {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: fadeInUp 0.25s ease both;
        }
        .product-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 0 1.5px rgba(99,102,241,0.6) !important;
          background: rgba(99,102,241,0.14) !important;
        }
        .product-card:active { transform: scale(0.97); }
        .qbtn { transition: all 0.15s; }
        .qbtn:hover { background: rgba(99,102,241,0.35) !important; transform: scale(1.12); }
        .checkout-btn { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .checkout-btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 12px 35px rgba(16,185,129,0.55) !important; }
        .checkout-btn:active { transform: scale(0.97); }
        .order-btn { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .order-btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 10px 28px rgba(245,158,11,0.45) !important; }
        .ref-card:hover { background: rgba(59,130,246,0.18) !important; border-color: rgba(59,130,246,0.6) !important; transform: translateY(-2px); }
        .cat-pill { transition: all 0.2s ease; }
        .cat-pill:hover { transform: scale(1.05); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
        .cart-item { transition: all 0.15s ease; }
        .cart-item:hover { background: rgba(255,255,255,0.06) !important; }
      `}</style>

      {/* ── TOPBAR HEADER ────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(12px)",
          flexWrap: "wrap",
          gap: 10,
          zIndex: 20,
          flexShrink: 0,
        }}
      >
        {/* Left: Branding & Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              color: "#fff",
              fontSize: 15,
              letterSpacing: 0.5,
              boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
            }}
          >
            BB
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: "#ffffff", letterSpacing: 0.3 }}>
                Baba Roti Café
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: "rgba(16,185,129,0.18)",
                  border: "1px solid rgba(16,185,129,0.4)",
                  color: "#34d399",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                ● POS Station Active
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Order &amp; Kitchen Dispatch Terminal</div>
          </div>
        </div>

        {/* Center: Dining Options + REFERENCE BUTTON */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Order Types */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.06)",
              padding: 3,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {[
              ["dine_in", "Dine In"],
              ["takeaway", "Takeaway"],
              ["delivery", "Delivery"],
            ].map(([val, label]) => {
              const active = orderType === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setOrderType(val);
                    if (val !== "dine_in") setSelectedTable("");
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 9,
                    border: "none",
                    background: active
                      ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                      : "transparent",
                    color: active ? "#ffffff" : "#94a3b8",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Table Button */}
          {orderType === "dine_in" && (
            <button
              type="button"
              onClick={() => setShowTablePicker(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 14px",
                borderRadius: 10,
                border: selectedTable
                  ? "1.5px solid #10b981"
                  : "1.5px solid rgba(255,255,255,0.12)",
                background: selectedTable ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                color: selectedTable ? "#10b981" : "#cbd5e1",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <Table2 size={14} />
              <span>{selectedTable ? `Table: ${selectedTable}` : "Table #"}</span>
              <ChevronDown size={12} />
            </button>
          )}

          {/* Waiter Selector */}
          <button
            type="button"
            onClick={() => setShowWaiterPicker(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 14px",
              borderRadius: 10,
              border: selectedWaiter
                ? "1.5px solid #8b5cf6"
                : "1.5px solid rgba(255,255,255,0.12)",
              background: selectedWaiter ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.05)",
              color: selectedWaiter ? "#a78bfa" : "#cbd5e1",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <User size={14} />
            <span>{selectedWaiter ? selectedWaiter.name : "Assign Waiter"}</span>
            <ChevronDown size={12} />
          </button>

          {/* ── THE REQUESTED REFERENCE BUTTON ── */}
          <button
            type="button"
            onClick={() => {
              loadHeldOrders();
              setShowRefModal(true);
            }}
            title="Click to view all active & held table orders and retrieve any order to the sidebar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 14px",
              borderRadius: 10,
              border: heldOrdersList.length > 0 ? "1.5px solid #3b82f6" : "1.5px solid rgba(255,255,255,0.12)",
              background: heldOrdersList.length > 0 ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.05)",
              color: heldOrdersList.length > 0 ? "#60a5fa" : "#94a3b8",
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: heldOrdersList.length > 0 ? "0 2px 10px rgba(59,130,246,0.25)" : "none",
            }}
          >
            <FileText size={14} />
            <span>Reference</span>
            {heldOrdersList.length > 0 && (
              <span
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 10,
                }}
              >
                {heldOrdersList.length}
              </span>
            )}
          </button>
        </div>

        {/* Right: Clock & User info */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Live Clock */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.05)",
              padding: "5px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12,
              fontWeight: 700,
              color: "#38bdf8",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <Clock size={13} />
            {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>

          {/* Current User */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(59,130,246,0.12)",
              padding: "4px 10px 4px 6px",
              borderRadius: 20,
              border: "1px solid rgba(59,130,246,0.3)",
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {user?.name?.[0]?.toUpperCase() || "A"}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#93c5fd" }}>
              {user?.name || "Cashier"}
            </span>
          </div>
        </div>
      </header>

      {/* ── MAIN 2-COLUMN VIEWPORT: CART ON LEFT | PRODUCTS ON RIGHT ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0, height: "100%" }}>

        {/* ══════════════════════════════════════════════════════════
            LEFT PANEL: CURRENT ORDER CART (Width ~ 380px)
           ══════════════════════════════════════════════════════════ */}
        <aside
          style={{
            width: 380,
            display: "flex",
            flexDirection: "column",
            background: "rgba(5, 10, 24, 0.75)",
            backdropFilter: "blur(16px)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
            zIndex: 10,
            height: "100%",
            maxHeight: "100%",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Order Header */}
          <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ReceiptText size={16} color="#38bdf8" />
                <span style={{ fontWeight: 800, fontSize: 14, color: "#ffffff", letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Current Order
                </span>
                <span
                  style={{
                    background: "rgba(59,130,246,0.2)",
                    border: "1px solid rgba(59,130,246,0.4)",
                    color: "#60a5fa",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 12,
                  }}
                >
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Header Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    loadHeldOrders();
                    setShowRefModal(true);
                  }}
                  title="View active held orders"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "rgba(59,130,246,0.15)",
                    border: "1px solid rgba(59,130,246,0.35)",
                    borderRadius: 8,
                    color: "#60a5fa",
                    padding: "4px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <FileText size={11} />
                  Ref ({heldOrdersList.length})
                </button>

                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={releaseRetrievedOrder}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 8,
                      color: "#f87171",
                      padding: "4px 8px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={11} />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* RETRIEVED HELD ORDER NOTIFICATION BANNER */}
            {heldOrderId && (
              <div
                style={{
                  background: "rgba(245,158,11,0.15)",
                  border: "1px solid rgba(245,158,11,0.4)",
                  borderRadius: 8,
                  padding: "6px 10px",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "#fbbf24",
                }}
              >
                <span>
                  🟡 <strong>Retrieved #{heldOrderNo}</strong> ({selectedTable || "Counter"})
                </span>
                <button
                  type="button"
                  onClick={releaseRetrievedOrder}
                  style={{
                    background: "rgba(245,158,11,0.2)",
                    border: "none",
                    borderRadius: 5,
                    color: "#fbbf24",
                    padding: "2px 6px",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ✕ Release
                </button>
              </div>
            )}

            {/* Optional Guest Name Input */}
            <div style={{ position: "relative", marginBottom: 8 }}>
              <User
                size={13}
                color="#64748b"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Guest Name (optional)"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  padding: "7px 10px 7px 30px",
                  fontSize: 12,
                  color: "#e2e8f0",
                  outline: "none",
                }}
              />
            </div>

            {/* Quick Table & Waiter Selectors directly inside Cart Sidebar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => setShowTablePicker(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 6,
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: selectedTable ? "1.5px solid #10b981" : "1.5px solid rgba(255,255,255,0.12)",
                  background: selectedTable ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.05)",
                  color: selectedTable ? "#10b981" : "#cbd5e1",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                title="Click to select table"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <Table2 size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedTable ? `Table: ${selectedTable}` : "🪑 Table #"}
                  </span>
                </div>
                <ChevronDown size={11} style={{ flexShrink: 0, opacity: 0.6 }} />
              </button>

              <button
                type="button"
                onClick={() => setShowWaiterPicker(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 6,
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: selectedWaiter ? "1.5px solid #8b5cf6" : "1.5px solid rgba(255,255,255,0.12)",
                  background: selectedWaiter ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.05)",
                  color: selectedWaiter ? "#a78bfa" : "#cbd5e1",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                title="Click to assign waiter"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <User size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedWaiter ? selectedWaiter.name : "👤 Waiter"}
                  </span>
                </div>
                <ChevronDown size={11} style={{ flexShrink: 0, opacity: 0.6 }} />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "8px 12px" }}>
            {items.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  minHeight: 180,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "20px 16px",
                  color: "#64748b",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px dashed rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <ShoppingBag size={22} style={{ opacity: 0.35, color: "#94a3b8" }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>Your cart is empty</p>
                <p style={{ fontSize: 11, color: "#64748b", marginTop: 4, maxWidth: 220, lineHeight: 1.4 }}>
                  Click items from the menu or click <strong style={{ color: "#60a5fa" }}>Reference</strong> to recall a held order
                </p>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={item.product + idx}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    marginBottom: 8,
                    transition: "all 0.15s",
                  }}
                >
                  {/* Top row: Name + Line Total */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "#ffffff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.productName}
                      </p>
                      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                        {ETB(item.unitPrice)} / unit
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "#38bdf8" }}>
                        {ETB(item.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Note display or edit */}
                  {item.notes && editingNoteIdx !== idx && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#f59e0b",
                        background: "rgba(245,158,11,0.1)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>💬 {item.notes}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteIdx(idx);
                          setNoteText(item.notes);
                        }}
                        style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", marginLeft: "auto", fontSize: 10 }}
                      >
                        Edit
                      </button>
                    </div>
                  )}

                  {editingNoteIdx === idx && (
                    <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add kitchen note (e.g. less spicy)..."
                        style={{
                          flex: 1,
                          background: "rgba(0,0,0,0.4)",
                          border: "1px solid rgba(245,158,11,0.5)",
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 11,
                          color: "#fff",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => saveItemNote(idx)}
                        style={{
                          background: "#f59e0b",
                          border: "none",
                          borderRadius: 6,
                          color: "#000",
                          fontWeight: 700,
                          fontSize: 11,
                          padding: "4px 8px",
                          cursor: "pointer",
                        }}
                      >
                        OK
                      </button>
                    </div>
                  )}

                  {/* Actions row: Note trigger + Stepper */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 8,
                      paddingTop: 6,
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    {!item.notes && editingNoteIdx !== idx ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteIdx(idx);
                          setNoteText("");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#64748b",
                          fontSize: 11,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          padding: 0,
                        }}
                      >
                        <Plus size={11} /> Add note
                      </button>
                    ) : (
                      <div />
                    )}

                    {/* Stepper + Delete */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                      <button
                        type="button"
                        className="qbtn"
                        onClick={() => changeQty(idx, -1)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: "none",
                          background: "rgba(255,255,255,0.08)",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Minus size={11} />
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", minWidth: 20, textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="qbtn"
                        onClick={() => changeQty(idx, 1)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: "none",
                          background: "rgba(255,255,255,0.08)",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          opacity: 0.7,
                          padding: "2px 4px",
                          marginLeft: 4,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── CART FOOTER: TOTALS & SIDE-TO-SIDE BUTTONS [ Order ] & [ Checkout > ] ── */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.38)",
              padding: "12px 14px",
              flexShrink: 0,
            }}
          >
            {/* Discount selector */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
                Discount:
              </span>
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 5, 10, 15].map((d) => {
                  const active = discountPct === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiscountPct(d)}
                      style={{
                        padding: "3px 10px",
                        borderRadius: 6,
                        border: active ? "1.5px solid #6366f1" : "1px solid rgba(255,255,255,0.1)",
                        background: active ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                        color: active ? "#a5b4fc" : "#64748b",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {d === 0 ? "None" : `${d}%`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line calculations */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                <span>Subtotal</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{ETB(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#fbbf24" }}>
                  <span>Discount ({discountPct}%)</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>- {ETB(discountAmt)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                <span>VAT / Tax ({settings.taxRate}%)</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{ETB(taxAmt)}</span>
              </div>
              {serviceCharge > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                  <span>Service Charge</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{ETB(serviceCharge)}</span>
                </div>
              )}
            </div>

            {/* TOTAL PAYABLE — matching requested visual */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                paddingTop: 8,
                borderTop: "1px solid rgba(255,255,255,0.08)",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.5, color: "#10b981", textTransform: "uppercase" }}>
                  TOTAL PAYABLE
                </div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Tax &amp; Service Included</div>
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#ffffff",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: -0.5,
                }}
              >
                {ETB(grandTotal)}
              </div>
            </div>

            {/* ── THE REQUESTED SIDE-TO-SIDE BUTTONS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                type="button"
                className="order-btn"
                disabled={placing}
                onClick={handleOrder}
                title="Save order as held and print KOT for kitchen"
                style={{
                  padding: "14px 12px",
                  borderRadius: 14,
                  border: "1.5px solid rgba(245,158,11,0.45)",
                  background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.15) 100%)",
                  color: "#fbbf24",
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: placing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  boxShadow: "0 4px 16px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
                  letterSpacing: 0.3,
                }}
              >
                <UtensilsCrossed size={16} />
                {heldOrderId ? "Update" : "🍽 Order"}
              </button>

              <button
                type="button"
                className="checkout-btn"
                disabled={placing}
                onClick={() => {
                  if (!items.length) { showToast("Please add items to cart", "error"); return; }
                  setShowPayModal(true);
                }}
                title="Pay now and automatically convert to Cash Sales"
                style={{
                  padding: "14px 12px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)",
                  color: "#ffffff",
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  boxShadow: "0 6px 20px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                  letterSpacing: 0.3,
                }}
              >
                <ReceiptText size={16} />
                Checkout ›
              </button>
            </div>

            {/* Reprint actions if lastOrder exists */}
            {lastOrder && (
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() =>
                    posPrint.printReceipt(lastOrder, {
                      hotelName: "Baba Roti Café",
                      taxRate: settings.taxRate,
                    })
                  }
                  style={{
                    flex: 1,
                    padding: "6px",
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: 8,
                    color: "#818cf8",
                    fontWeight: 600,
                    fontSize: 11,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <Printer size={12} />
                  Receipt
                </button>
                <button
                  type="button"
                  onClick={() => posPrint.printKOT(lastOrder, { businessName: "Baba Roti Café" })}
                  style={{
                    flex: 1,
                    padding: "6px",
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: 8,
                    color: "#f59e0b",
                    fontWeight: 600,
                    fontSize: 11,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <UtensilsCrossed size={12} />
                  KOT
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════════
            RIGHT PANEL: PRODUCT CATALOG (Search + Categories + Grid)
           ══════════════════════════════════════════════════════════ */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "transparent",
            height: "100%",
            maxHeight: "100%",
            minHeight: 0,
          }}
        >
          {/* Search bar */}
          <div style={{ padding: "10px 16px 0", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search
                size={16}
                color="#64748b"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                ref={searchRef}
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search products by name or code (e.g. Coffee, Burger, Roll)..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "rgba(255,255,255,0.06)",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "9px 12px 9px 38px",
                  color: "#ffffff",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            {searchQ && (
              <button
                type="button"
                onClick={() => setSearchQ("")}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Categories Pill Strip */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 16px",
              overflowX: "auto",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              scrollbarWidth: "none",
              flexShrink: 0,
              background: "rgba(0,0,0,0.2)",
            }}
          >
            {categories.map((cat, ci) => {
              const active = activeCategory === cat;
              const catColors = [
                "#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#ec4899","#14b8a6",
              ];
              const c = catColors[ci % catColors.length];
              return (
                <button
                  key={cat}
                  type="button"
                  className="cat-pill"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "7px 18px",
                    borderRadius: 50,
                    border: active ? `1.5px solid ${c}` : "1px solid rgba(255,255,255,0.1)",
                    background: active
                      ? `linear-gradient(135deg, ${c}33 0%, ${c}22 100%)`
                      : "rgba(255,255,255,0.04)",
                    color: active ? c : "#94a3b8",
                    fontWeight: active ? 800 : 600,
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: active ? `0 0 16px ${c}44, 0 2px 8px rgba(0,0,0,0.3)` : "none",
                    letterSpacing: 0.3,
                  }}
                >
                  {cat === "All" ? "✦ All Items" : cat}
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
              gap: 14,
              padding: "16px",
              overflowY: "auto",
              alignContent: "start",
              minHeight: 0,
            }}
          >
            {filteredProducts.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                <UtensilsCrossed size={36} style={{ marginBottom: 10, opacity: 0.35 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No products found</p>
                <p style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                  Try a different search term or category
                </p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const inCart = items.find(
                  (item) => (item.product?._id || item.product) === p._id
                );
                const isSelected = !!inCart;
                return (
                  <div
                    key={p._id}
                    className="product-card"
                    onClick={() => addItem(p)}
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(99,102,241,0.15) 100%)"
                        : "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
                      border: isSelected
                        ? "1.5px solid rgba(99,102,241,0.6)"
                        : "1.5px solid rgba(255,255,255,0.09)",
                      borderRadius: 18,
                      padding: "14px 14px 12px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0,
                      position: "relative",
                      overflow: "hidden",
                      backdropFilter: "blur(6px)",
                      boxShadow: isSelected
                        ? "0 8px 30px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1)"
                        : "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* Top shimmer line */}
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 2,
                      background: isSelected
                        ? "linear-gradient(90deg, #6366f1, #3b82f6)"
                        : "linear-gradient(90deg, rgba(255,255,255,0.15), transparent)",
                      borderRadius: "18px 18px 0 0",
                    }} />

                    {/* Category icon area */}
                    {(() => {
                      const catColorMap = {
                        "Dinner": { bg: "rgba(245,158,11,0.18)", color: "#fbbf24", emoji: "🍽️" },
                        "Break Fast": { bg: "rgba(16,185,129,0.18)", color: "#34d399", emoji: "☀️" },
                        "Breakfast": { bg: "rgba(16,185,129,0.18)", color: "#34d399", emoji: "☀️" },
                        "Lunch": { bg: "rgba(251,146,60,0.18)", color: "#fb923c", emoji: "🌤️" },
                        "Drinks": { bg: "rgba(6,182,212,0.18)", color: "#22d3ee", emoji: "🥤" },
                        "Beverages": { bg: "rgba(6,182,212,0.18)", color: "#22d3ee", emoji: "☕" },
                        "Desserts": { bg: "rgba(236,72,153,0.18)", color: "#f472b6", emoji: "🍰" },
                        "Starters": { bg: "rgba(139,92,246,0.18)", color: "#a78bfa", emoji: "🥗" },
                        "Snacks": { bg: "rgba(234,179,8,0.18)", color: "#facc15", emoji: "🥨" },
                        "General": { bg: "rgba(99,102,241,0.18)", color: "#818cf8", emoji: "⭐" },
                      };
                      const cc = catColorMap[p.category] || { bg: "rgba(99,102,241,0.18)", color: "#818cf8", emoji: "🍴" };
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: cc.bg,
                            border: `1px solid ${cc.color}33`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18, flexShrink: 0,
                          }}>
                            {cc.emoji}
                          </div>
                          <span style={{
                            fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                            color: cc.color, letterSpacing: 1,
                            background: cc.bg, padding: "2px 7px", borderRadius: 20,
                          }}>
                            {p.category || "General"}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Product Name */}
                    <div style={{
                      fontWeight: 800, fontSize: 15, color: "#ffffff",
                      lineHeight: 1.25, paddingRight: isSelected ? 22 : 0,
                      marginBottom: 4, flex: 1,
                    }}>
                      {p.name}
                    </div>

                    {/* Product Code */}
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 10, fontFamily: "monospace" }}>
                      #{p.code || "—"}
                    </div>

                    {/* Price + Tag row */}
                    <div style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 8,
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      <span style={{
                        fontWeight: 900, fontSize: 15, color: "#10b981",
                        background: "rgba(16,185,129,0.12)",
                        padding: "3px 10px", borderRadius: 20,
                        border: "1px solid rgba(16,185,129,0.25)",
                        letterSpacing: -0.3,
                      }}>
                        {Number(p.sellingPrice || 0).toFixed(0)} ETB
                      </span>
                      {(p.ingredients?.length || 0) > 0 ? (
                        <span style={{
                          fontSize: 9, color: "#fbbf24", fontWeight: 800,
                          background: "rgba(245,158,11,0.15)", padding: "2px 7px",
                          borderRadius: 20, border: "1px solid rgba(245,158,11,0.3)",
                        }}>⚡ Recipe</span>
                      ) : (
                        <span style={{
                          fontSize: 9, color: "#64748b", fontWeight: 600,
                          background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 20,
                        }}>Direct</span>
                      )}
                    </div>

                    {/* Cart quantity badge */}
                    {isSelected && (
                      <span style={{
                        position: "absolute", top: 10, right: 10,
                        width: 24, height: 24, borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                        color: "#fff", fontSize: 11, fontWeight: 900,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(99,102,241,0.6)",
                        animation: "pulse-glow 2s infinite",
                      }}>
                        {inCart.quantity}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════
          REFERENCE MODAL: SHOWS ALL ACTIVE ORDERS & RETRIEVES TO SIDEBAR
         ══════════════════════════════════════════════════════════ */}
      {showRefModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 600,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowRefModal(false)}
        >
          <div
            style={{
              background: "linear-gradient(135deg,#0c1533,#0f1f4d)",
              border: "1.5px solid rgba(59,130,246,0.35)",
              borderRadius: 20,
              padding: 26,
              width: "100%",
              maxWidth: 700,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={18} color="#60a5fa" />
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", margin: 0 }}>
                    Active &amp; Held Table Orders (Reference)
                  </h3>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  Click any table order below to retrieve it into the sidebar cart for billing / checkout.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRefModal(false)}
                style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "#94a3b8", cursor: "pointer", padding: 6 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search filter in modal */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <Search size={14} color="#64748b" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={refSearchQ}
                onChange={(e) => setRefSearchQ(e.target.value)}
                placeholder="Search by Table #, Waiter, or Order #..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 12px 8px 34px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>

            {/* List of Held Orders */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredRefOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                  <UtensilsCrossed size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ fontSize: 13, fontWeight: 600 }}>No active held orders found</p>
                </div>
              ) : (
                filteredRefOrders.map((o) => (
                  <div
                    key={o._id}
                    className="ref-card"
                    onClick={() => retrieveOrderToSidebar(o)}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1.5px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: "12px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: "#60a5fa" }}>#{o.orderNo}</span>
                        <span
                          style={{
                            background: "rgba(16,185,129,0.15)",
                            border: "1px solid rgba(16,185,129,0.3)",
                            color: "#34d399",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          🪑 {o.tableNo || "Counter"}
                        </span>
                        {o.waiterName && (
                          <span style={{ fontSize: 11, color: "#c084fc", fontWeight: 600 }}>
                            👤 {o.waiterName}
                          </span>
                        )}
                        <span
                          style={{
                            background: o.status === "held" ? "rgba(139,92,246,0.15)" : "rgba(245,158,11,0.15)",
                            color: o.status === "held" ? "#c084fc" : "#fbbf24",
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {o.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {(o.items || []).map((it) => `${it.productName} (x${it.quantity})`).join(", ")}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 14 }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 16, color: "#10b981" }}>
                          {ETB(o.grandTotal)}
                        </div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>
                          {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          retrieveOrderToSidebar(o);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "none",
                          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <ArrowDownLeft size={13} />
                        Retrieve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT MODAL ────────────────────────────────────────── */}
      {showPayModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowPayModal(false)}
        >
          <div
            style={{
              background: "linear-gradient(135deg,#0c1533,#0f1f4d)",
              border: "1.5px solid rgba(99,102,241,0.35)",
              borderRadius: 20,
              padding: 26,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: "#ffffff", margin: 0 }}>
                  Payment &amp; Settlement
                </h3>
                {heldOrderId && (
                  <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>
                    Converting #{heldOrderNo} to Cash Sales
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  borderRadius: 8,
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 6,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Total display */}
            <div
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1.5px solid rgba(16,185,129,0.25)",
                borderRadius: 14,
                padding: "12px 16px",
                marginBottom: 18,
                textAlign: "center",
              }}
            >
              <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4, textTransform: "uppercase", fontWeight: 700 }}>
                Total Payable
              </p>
              <p style={{ fontWeight: 900, fontSize: 28, color: "#10b981", margin: 0 }}>
                {ETB(grandTotal)}
              </p>
            </div>

            {/* Payment Methods */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 18 }}>
              {[
                ["Cash", Banknote, "#10b981"],
                ["Telebirr", Smartphone, "#6366f1"],
                ["Card", CreditCard, "#f59e0b"],
              ].map(([m, Icon, clr]) => (
                <button
                  key={m}
                  type="button"
                  style={{
                    padding: "10px 6px",
                    borderRadius: 12,
                    border: payMethod === m ? `2px solid ${clr}` : "1.5px solid rgba(255,255,255,0.1)",
                    background:
                      payMethod === m
                        ? `rgba(${clr === "#10b981" ? "16,185,129" : clr === "#6366f1" ? "99,102,241" : "245,158,11"},0.15)`
                        : "rgba(255,255,255,0.04)",
                    color: payMethod === m ? clr : "#94a3b8",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                  }}
                  onClick={() => setPayMethod(m)}
                >
                  <Icon size={18} />
                  {m}
                </button>
              ))}
            </div>

            {/* Cash Tender Input */}
            {payMethod === "Cash" && (
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>
                  Cash Tendered (ETB)
                </p>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={String(grandTotal)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1.5px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
                {change > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 8,
                      padding: "8px 12px",
                      background: "rgba(59,130,246,0.15)",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#60a5fa",
                    }}
                  >
                    <span>Change Due:</span>
                    <span>{ETB(change)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Confirm button */}
            <button
              type="button"
              disabled={placing}
              onClick={placeOrder}
              style={{
                width: "100%",
                padding: 14,
                background: placing ? "#374151" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none",
                borderRadius: 14,
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
                cursor: placing ? "not-allowed" : "pointer",
                letterSpacing: 0.3,
                transition: "all 0.2s",
                boxShadow: "0 6px 20px rgba(16,185,129,0.4)",
              }}
            >
              {placing ? "Processing Sale & Deducting Stock..." : "Confirm & Complete Cash Sale"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TABLE PICKER MODAL (Dedicated full overlay, zero click bleeding)
         ══════════════════════════════════════════════════════════ */}
      {showTablePicker && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 900,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowTablePicker(false)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0c1533 0%, #0f1f4d 100%)",
              border: "1.5px solid rgba(99,102,241,0.4)",
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 580,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 70px rgba(0,0,0,0.8)",
              color: "#e2e8f0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(16,185,129,0.2)",
                    border: "1px solid rgba(16,185,129,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10b981",
                  }}
                >
                  <Table2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff" }}>Select Dining Table</h3>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    Click table to assign. If it has a held order, it will be recalled automatically.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTablePicker(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: 8,
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 7,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Section Filter Pills */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
              {["All", "Main Hall", "VIP Lounge", "Outdoor Patio"].map((sec) => {
                const active = tableSectionFilter === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTableSectionFilter(sec)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 16,
                      fontSize: 11,
                      fontWeight: 700,
                      border: active ? "1.5px solid #10b981" : "1px solid rgba(255,255,255,0.1)",
                      background: active ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                      color: active ? "#34d399" : "#94a3b8",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>

            {/* Tables Grid */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))",
                gap: 8,
                padding: "4px 2px",
                maxHeight: 340,
              }}
            >
              {ALL_TABLES.filter(
                (t) => tableSectionFilter === "All" || t.section === tableSectionFilter
              ).map((t) => {
                const busy = isTableBusy(t.id);
                const isSel = selectedTable === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTable(t.id);
                      setShowTablePicker(false);
                      const tableOrder = heldOrdersList.find((o) => o.tableNo === t.id);
                      if (tableOrder) {
                        retrieveOrderToSidebar(tableOrder);
                      }
                    }}
                    style={{
                      padding: "12px 6px",
                      borderRadius: 10,
                      border: isSel
                        ? "2px solid #10b981"
                        : busy
                        ? "1.5px solid rgba(245,158,11,0.6)"
                        : "1.5px solid rgba(255,255,255,0.08)",
                      background: isSel
                        ? "rgba(16,185,129,0.25)"
                        : busy
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(255,255,255,0.04)",
                      color: isSel ? "#10b981" : busy ? "#fbbf24" : "#e2e8f0",
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s ease",
                      boxShadow: isSel ? "0 0 14px rgba(16,185,129,0.35)" : "none",
                    }}
                  >
                    <Table2 size={16} />
                    <span>{t.id}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: isSel
                          ? "rgba(16,185,129,0.3)"
                          : busy
                          ? "rgba(245,158,11,0.25)"
                          : "rgba(255,255,255,0.06)",
                        color: isSel ? "#34d399" : busy ? "#fbbf24" : "#64748b",
                      }}
                    >
                      {isSel ? "Selected" : busy ? "Held Order" : "Free"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer with Clear table */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedTable("");
                  setShowTablePicker(false);
                }}
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  color: "#f87171",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Clear Table (Counter)
              </button>

              <button
                type="button"
                onClick={() => setShowTablePicker(false)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  padding: "6px 16px",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          WAITER PICKER MODAL (Dedicated full overlay, zero click bleeding)
         ══════════════════════════════════════════════════════════ */}
      {showWaiterPicker && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 900,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowWaiterPicker(false)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0c1533 0%, #15113d 100%)",
              border: "1.5px solid rgba(139,92,246,0.4)",
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 440,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 70px rgba(0,0,0,0.8)",
              color: "#e2e8f0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(139,92,246,0.2)",
                    border: "1px solid rgba(139,92,246,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#a78bfa",
                  }}
                >
                  <User size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff" }}>Assign Waiter / Server</h3>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    Select staff handling this table or order.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWaiterPicker(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: 8,
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 7,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Waiter Search Box */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <Search
                size={14}
                color="#64748b"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                value={waiterSearchQ}
                onChange={(e) => setWaiterSearchQ(e.target.value)}
                placeholder="Search staff name..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 12px 8px 34px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#fff",
                  outline: "none",
                }}
              />
            </div>

            {/* Waiter List */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, maxHeight: 300 }}>
              {/* Option: No Waiter */}
              <button
                type="button"
                onClick={() => {
                  setSelectedWaiter(null);
                  setShowWaiterPicker(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: !selectedWaiter ? "1.5px solid #8b5cf6" : "1px solid rgba(255,255,255,0.06)",
                  background: !selectedWaiter ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.03)",
                  color: !selectedWaiter ? "#a78bfa" : "#94a3b8",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>— No Waiter (Counter / Self) —</span>
                {!selectedWaiter && <Check size={14} />}
              </button>

              {waiters
                .filter((w) => !waiterSearchQ || w.name.toLowerCase().includes(waiterSearchQ.toLowerCase()))
                .map((w) => {
                  const isSel = selectedWaiter?._id === w._id || selectedWaiter?.name === w.name;
                  return (
                    <button
                      key={w._id || w.name}
                      type="button"
                      onClick={() => {
                        setSelectedWaiter(w);
                        setShowWaiterPicker(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "9px 12px",
                        borderRadius: 10,
                        border: isSel ? "1.5px solid #8b5cf6" : "1px solid rgba(255,255,255,0.06)",
                        background: isSel ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.03)",
                        color: "#e2e8f0",
                        cursor: "pointer",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {w.name?.[0]?.toUpperCase()}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: isSel ? "#c4b5fd" : "#fff" }}>
                          {w.name}
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{w.role || "Staff"}</div>
                      </div>
                      {isSel && <Check size={16} color="#a78bfa" />}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
