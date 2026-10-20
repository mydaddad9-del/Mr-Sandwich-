import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { posPrint } from "../utils/posPrint";
import {
  Search, X, Clock, Printer, CreditCard, Smartphone, Banknote,
  ReceiptText, RefreshCw, CheckCircle2, AlertCircle, Eye,
  ArrowRight, ShoppingBag, ChevronDown, Layers, Filter,
  BadgeDollarSign, UtensilsCrossed, Calendar, FileText, Ban,
  User, Table2, ArrowUpRight, DollarSign, RotateCcw,
} from "lucide-react";

const ETB = (n) => `ETB ${Number(n || 0).toFixed(2)}`;

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

export default function CashSales() {
  const [activeTab, setActiveTab] = useState("report"); // "report" | "settle"
  const [paidOrders, setPaidOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateVal, setDateVal] = useState(new Date().toISOString().slice(0, 10));
  const [searchQ, setSearchQ] = useState("");
  const [payMethodFilter, setPayMethodFilter] = useState("all");

  // Reference Modal State (Displays products & details)
  const [refOrder, setRefOrder] = useState(null);

  // Settlement Modal State (For settling pending captain orders)
  const [settleOrder, setSettleOrder] = useState(null);
  const [settleMethod, setSettleMethod] = useState("Cash");
  const [settleAmountPaid, setSettleAmountPaid] = useState("");
  const [settling, setSettling] = useState(false);

  const [toast, setToast] = useState(null);
  const [clock, setClock] = useState(new Date());

  const showToast = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load Completed Sales (ONLY Sales Status: Paid / Completed - no void/held in sales figures)
  const loadPaidOrders = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/pos/orders?paymentStatus=paid&limit=300`;
      if (dateVal) url += `&date=${dateVal}`;
      const res = await api.get(url);
      setPaidOrders(res.data || []);
    } catch (e) {
      showToast("Failed to load cash sales", "error");
    } finally {
      setLoading(false);
    }
  }, [dateVal]);

  // Load Pending/Held Captain Orders for settlement
  const loadPendingOrders = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await api.get(`/captain-orders?date=${today}&limit=200`);
      const all = res.data || [];
      // Only include active orders that have not been paid, voided, or cancelled
      setPendingOrders(all.filter((o) => ["open", "held", "sent_to_kitchen", "ready", "billed"].includes(o.status)));
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadPaidOrders();
    loadPendingOrders();
  }, [loadPaidOrders, loadPendingOrders]);


  // Convert pending captain order -> paid cash sale (deducts stock!)
  const handleSettleOrder = async () => {
    if (!settleOrder) return;
    setSettling(true);
    try {
      const o = settleOrder;
      const payload = {
        orderType: o.orderType || "dine_in",
        tableNo: o.tableNo || "",
        customerName: o.customerName || "Walk-in Guest",
        waiter: o.waiter || null,
        waiterName: o.waiterName || "",
        captainOrderRef: o._id,
        items: (o.items || []).map((it) => ({
          product: it.product,
          productName: it.productName,
          productCode: it.productCode || "",
          category: it.category || "General",
          parentCategory: it.parentCategory || "FOOD",
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          notes: it.notes || "",
        })),
        discountPercent: o.discountPercent || 0,
        serviceCharge: o.serviceCharge || 0,
        paymentMethod: settleMethod,
        amountPaid: Number(settleAmountPaid) || o.grandTotal,
        paymentStatus: "paid",
      };

      const res = await api.post("/pos/orders", payload);
      const posOrder = res.data.order;

      // Mark captain order as paid
      await api.patch(`/captain-orders/${o._id}`, { status: "paid" });

      // Print thermal receipt
      posPrint.printReceipt(posOrder, {
        hotelName: "Baba Roti Café",
        taxRate: 15,
      });

      showToast(`Sale #${posOrder.orderNo} completed & stock deducted!`);
      setSettleOrder(null);
      setSettleAmountPaid("");
      loadPendingOrders();
      loadPaidOrders();
      setActiveTab("report");
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to settle sale", "error");
    } finally {
      setSettling(false);
    }
  };

  // Filtered sales records (only sales status, strictly paid)
  const filteredSales = paidOrders.filter((o) => {
    if (payMethodFilter !== "all" && o.paymentMethod !== payMethodFilter) return false;
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    const matchNo = (o.orderNo || "").toLowerCase().includes(q);
    const matchTable = (o.tableNo || "").toLowerCase().includes(q);
    const matchCashier = (o.cashierName || "").toLowerCase().includes(q);
    const matchWaiter = (o.waiterName || "").toLowerCase().includes(q);
    const matchCustomer = (o.customerName || "").toLowerCase().includes(q);
    const matchItem = (o.items || []).some(
      (it) =>
        (it.productName || "").toLowerCase().includes(q) ||
        (it.productCode || "").toLowerCase().includes(q)
    );
    return matchNo || matchTable || matchCashier || matchWaiter || matchCustomer || matchItem;
  });

  // KPI calculations (strictly sales status)
  const totalRevenue = filteredSales.reduce((s, o) => s + (o.grandTotal || 0), 0);
  const totalCash = filteredSales.filter((o) => o.paymentMethod === "Cash").reduce((s, o) => s + (o.grandTotal || 0), 0);
  const totalTelebirr = filteredSales.filter((o) => o.paymentMethod === "Telebirr").reduce((s, o) => s + (o.grandTotal || 0), 0);
  const totalCard = filteredSales.filter((o) => o.paymentMethod === "Card").reduce((s, o) => s + (o.grandTotal || 0), 0);
  const totalTxnCount = filteredSales.length;

  const settleChange = settleOrder
    ? Math.max(0, (Number(settleAmountPaid) || 0) - (settleOrder.grandTotal || 0))
    : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #070c1e 0%, #0a1128 50%, #0d173d 100%)",
        color: "#e2e8f0",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideInRight { from { transform: translateX(120%); opacity:0 } to { transform: translateX(0); opacity:1 } }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeInUp { from { transform: translateY(10px); opacity:0 } to { transform: translateY(0); opacity:1 } }
        @keyframes shimmer { 0% { background-position: -200% center } 100% { background-position: 200% center } }
        .sale-row { transition: all 0.15s ease; }
        .sale-row:hover { background: rgba(16,185,129,0.09) !important; transform: translateX(2px); }
        .kpi-card { animation: fadeInUp 0.3s ease both; transition: all 0.2s ease; }
        .kpi-card:hover { transform: translateY(-3px); }
        .ref-btn:hover { background: rgba(16,185,129,0.3) !important; border-color: rgba(16,185,129,0.7) !important; transform: scale(1.02); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>

      {/* ── TOPBAR HEADER ────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(12px)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 900,
              boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
            }}
          >
            <BadgeDollarSign size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                Cash Sales &amp; Revenue Report
              </h2>
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
                }}
              >
                ● Paid Sales Only
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              Settled revenue records, tender breakdown, stock deduction history, and receipt audit
            </div>
          </div>
        </div>

        {/* Tab switchers + Date + Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.06)",
              padding: 3,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              onClick={() => setActiveTab("report")}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background: activeTab === "report" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "transparent",
                color: activeTab === "report" ? "#fff" : "#94a3b8",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Sales Report ({filteredSales.length})
            </button>
            <button
              onClick={() => setActiveTab("settle")}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background: activeTab === "settle" ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "transparent",
                color: activeTab === "settle" ? "#fff" : "#94a3b8",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Settle Pending Orders ({pendingOrders.length})
            </button>
          </div>

          {/* Date Picker */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "4px 10px",
              borderRadius: 8,
            }}
          >
            <Calendar size={13} color="#94a3b8" />
            <input
              type="date"
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#e2e8f0",
                fontSize: 12,
                outline: "none",
                cursor: "pointer",
              }}
            />
          </div>

          <button
            onClick={() => {
              loadPaidOrders();
              loadPendingOrders();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#94a3b8",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>

          <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", fontVariantNumeric: "tabular-nums" }}>
            {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>
      </header>

      {/* ── PREMIUM KPI METRICS CARDS ── */}
      {activeTab === "report" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
            padding: "16px 20px 0",
          }}
        >
          {[
            {
              label: "Total Cash Sales", value: ETB(totalRevenue),
              sub: `${totalTxnCount} completed sales`,
              color: "#10b981", glow: "rgba(16,185,129,0.3)",
              bg: "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.1) 100%)",
              border: "rgba(16,185,129,0.35)", icon: "💰",
            },
            {
              label: "Cash Tendered", value: ETB(totalCash),
              sub: "Physical cash in drawer",
              color: "#34d399", glow: "rgba(52,211,153,0.25)",
              bg: "linear-gradient(135deg, rgba(52,211,153,0.16) 0%, rgba(16,185,129,0.08) 100%)",
              border: "rgba(52,211,153,0.3)", icon: "💵",
            },
            {
              label: "Telebirr Sales", value: ETB(totalTelebirr),
              sub: "Digital wallet settlement",
              color: "#60a5fa", glow: "rgba(96,165,250,0.25)",
              bg: "linear-gradient(135deg, rgba(96,165,250,0.16) 0%, rgba(59,130,246,0.08) 100%)",
              border: "rgba(96,165,250,0.3)", icon: "📱",
            },
            {
              label: "Card / POS Terminal", value: ETB(totalCard),
              sub: "Bank credit/debit card",
              color: "#fbbf24", glow: "rgba(251,191,36,0.25)",
              bg: "linear-gradient(135deg, rgba(251,191,36,0.16) 0%, rgba(245,158,11,0.08) 100%)",
              border: "rgba(251,191,36,0.3)", icon: "💳",
            },
          ].map((k, i) => (
            <div
              key={i}
              className="kpi-card"
              style={{
                background: k.bg,
                border: `1.5px solid ${k.border}`,
                borderRadius: 18,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                position: "relative",
                overflow: "hidden",
                boxShadow: `0 8px 30px ${k.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
                animationDelay: `${i * 0.07}s`,
              }}
            >
              {/* Top shimmer line */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${k.color}, transparent)`,
                borderRadius: "18px 18px 0 0",
              }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {k.label}
                </span>
                <span style={{ fontSize: 22 }}>{k.icon}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: k.color, fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>
                {k.value}
              </div>
              <span style={{
                fontSize: 11, color: "#64748b",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: k.color, display: "inline-block", opacity: 0.7 }} />
                {k.sub}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      {activeTab === "report" && (
        <div style={{ padding: "14px 20px 0", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <Search
              size={15}
              color="#64748b"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search by Product Code, Name, Table #, Waiter, Cashier, or Reference #..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 12px 8px 36px",
                background: "rgba(255,255,255,0.05)",
                border: "1.5px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#fff",
                fontSize: 12,
                outline: "none",
              }}
            />
            {searchQ && (
              <button
                onClick={() => setSearchQ("")}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Payment Method filter pills */}
          <div style={{ display: "flex", gap: 6 }}>
            {["all", "Cash", "Telebirr", "Card"].map((m) => {
              const active = payMethodFilter === m;
              return (
                <button
                  key={m}
                  onClick={() => setPayMethodFilter(m)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: active ? "1.5px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                    background: active ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.03)",
                    color: active ? "#34d399" : "#94a3b8",
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {m === "all" ? "All Methods" : m}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT VIEWPORT ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {/* ══════════════════════════════════════════════════════════
            TAB 1: COMPLETED CASH SALES REPORT (Excludes void & held)
           ══════════════════════════════════════════════════════════ */}
        {activeTab === "report" && (
          loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <RefreshCw size={32} color="#10b981" style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ marginTop: 12, color: "#94a3b8", fontSize: 13 }}>Loading Sales Report...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px dashed rgba(255,255,255,0.08)",
              }}
            >
              <ReceiptText size={40} color="#64748b" style={{ opacity: 0.4, marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>No Completed Sales Found</p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                This report only includes paid/completed sales. Held or voided orders are excluded.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(0,0,0,0.25)",
                border: "1.5px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
                  <thead>
                    <tr
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderBottom: "1.5px solid rgba(255,255,255,0.08)",
                        color: "#94a3b8",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontSize: 11,
                      }}
                    >
                      <th style={{ padding: "12px 14px" }}>Reference #</th>
                      <th style={{ padding: "12px 14px" }}>Products Sold (Code &amp; Name)</th>
                      <th style={{ padding: "12px 14px" }}>Table</th>
                      <th style={{ padding: "12px 14px" }}>Waiter</th>
                      <th style={{ padding: "12px 14px" }}>Cashier</th>
                      <th style={{ padding: "12px 14px" }}>Time</th>
                      <th style={{ padding: "12px 14px" }}>Method</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Total</th>
                      <th style={{ padding: "12px 14px", textAlign: "center" }}>Sales Status</th>
                      <th style={{ padding: "12px 14px", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((s) => {
                      const itemsSummary = (s.items || []).map((it) => (
                        <span
                          key={it.product + it.productName}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            padding: "2px 8px",
                            borderRadius: 6,
                            marginRight: 6,
                            marginBottom: 4,
                            fontSize: 11,
                          }}
                        >
                          {it.productCode && (
                            <span style={{ color: "#38bdf8", fontWeight: 700 }}>#{it.productCode}</span>
                          )}
                          <span style={{ color: "#ffffff", fontWeight: 600 }}>{it.productName}</span>
                          <span style={{ color: "#10b981", fontWeight: 800 }}>x{it.quantity}</span>
                        </span>
                      ));

                      return (
                        <tr
                          key={s._id}
                          className="sale-row"
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            transition: "background 0.15s",
                          }}
                        >
                          {/* Reference Button */}
                          <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                            <button
                              type="button"
                              className="ref-btn"
                              onClick={() => setRefOrder(s)}
                              title="Click to view ordered products and transaction reference"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "4px 10px",
                                borderRadius: 8,
                                background: "rgba(16,185,129,0.15)",
                                border: "1px solid rgba(16,185,129,0.4)",
                                color: "#34d399",
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                            >
                              <FileText size={12} />
                              #{s.orderNo}
                            </button>
                          </td>

                          {/* Products Sold */}
                          <td style={{ padding: "12px 14px", verticalAlign: "middle", maxWidth: 360 }}>
                            <div style={{ display: "flex", flexWrap: "wrap" }}>{itemsSummary}</div>
                          </td>

                          {/* Table */}
                          <td style={{ padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                background: "rgba(59,130,246,0.12)",
                                border: "1px solid rgba(59,130,246,0.3)",
                                color: "#60a5fa",
                                fontWeight: 700,
                                fontSize: 11,
                                padding: "3px 8px",
                                borderRadius: 6,
                              }}
                            >
                              🪑 {s.tableNo || "Counter"}
                            </span>
                          </td>

                          {/* Waiter */}
                          <td style={{ padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                            <span style={{ color: "#c084fc", fontWeight: 600 }}>
                              👤 {s.waiterName || "—"}
                            </span>
                          </td>

                          {/* Cashier */}
                          <td style={{ padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                            <span style={{ color: "#94a3b8", fontWeight: 600 }}>
                              {s.cashierName || "Staff"}
                            </span>
                          </td>

                          {/* Time */}
                          <td style={{ padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap", color: "#94a3b8" }}>
                            {new Date(s.createdAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>

                          {/* Payment Method */}
                          <td style={{ padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                background:
                                  s.paymentMethod === "Cash"
                                    ? "rgba(16,185,129,0.15)"
                                    : s.paymentMethod === "Telebirr"
                                    ? "rgba(59,130,246,0.15)"
                                    : "rgba(245,158,11,0.15)",
                                color:
                                  s.paymentMethod === "Cash"
                                    ? "#34d399"
                                    : s.paymentMethod === "Telebirr"
                                    ? "#60a5fa"
                                    : "#fbbf24",
                                fontWeight: 700,
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 6,
                              }}
                            >
                              {s.paymentMethod}
                            </span>
                          </td>

                          {/* Grand Total */}
                          <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "right", whiteSpace: "nowrap" }}>
                            <span style={{ fontWeight: 900, color: "#10b981", fontSize: 13 }}>
                              {ETB(s.grandTotal)}
                            </span>
                          </td>

                          {/* Sales Status (Only Paid/Completed) */}
                          <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "center", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                background: "rgba(16,185,129,0.15)",
                                border: "1px solid rgba(16,185,129,0.4)",
                                color: "#34d399",
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 800,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <CheckCircle2 size={11} />
                              Paid / Sold
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "center", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                              <button
                                type="button"
                                onClick={() => setRefOrder(s)}
                                title="View Reference Details"
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: 8,
                                  border: "1px solid rgba(255,255,255,0.12)",
                                  background: "rgba(255,255,255,0.05)",
                                  color: "#e2e8f0",
                                  fontWeight: 600,
                                  fontSize: 11,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Eye size={12} />
                                Ref
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  posPrint.printReceipt(s, {
                                    hotelName: "Baba Roti Café",
                                    taxRate: s.taxPercent || 15,
                                    isReprint: true,
                                  })
                                }
                                title="Reprint Thermal Receipt"
                                style={{
                                  padding: "5px 8px",
                                  borderRadius: 8,
                                  border: "1px solid rgba(59,130,246,0.3)",
                                  background: "rgba(59,130,246,0.12)",
                                  color: "#60a5fa",
                                  fontWeight: 600,
                                  fontSize: 11,
                                  cursor: "pointer",
                                }}
                              >
                                <Printer size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: SETTLE PENDING CAPTAIN / HELD ORDERS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === "settle" && (
          pendingOrders.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px dashed rgba(255,255,255,0.08)",
              }}
            >
              <CheckCircle2 size={40} color="#10b981" style={{ opacity: 0.6, marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>All Orders Settled</p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                No active held or open dining table orders awaiting payment.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 14,
              }}
            >
              {pendingOrders.map((o) => (
                <div
                  key={o._id}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1.5px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#38bdf8" }}>#{o.orderNo}</span>
                    <span
                      style={{
                        background: o.status === "held" ? "rgba(139,92,246,0.15)" : "rgba(245,158,11,0.15)",
                        border: `1px solid ${o.status === "held" ? "#a855f7" : "#f59e0b"}`,
                        color: o.status === "held" ? "#c084fc" : "#fbbf24",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      {o.status}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#94a3b8" }}>
                    <span>🪑 {o.tableNo || "Counter"}</span>
                    <span>👤 {o.waiterName || "Staff"}</span>
                    <span>👥 {o.guestCount || 1} Guests</span>
                  </div>

                  {/* Items list */}
                  <div
                    style={{
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: 10,
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      maxHeight: 120,
                      overflowY: "auto",
                      fontSize: 11,
                    }}
                  >
                    {(o.items || []).map((it, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#e2e8f0" }}>
                          {it.productCode && <span style={{ color: "#38bdf8", marginRight: 4 }}>#{it.productCode}</span>}
                          {it.productName} x{it.quantity}
                        </span>
                        <span style={{ color: "#94a3b8" }}>{ETB(it.totalPrice)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: 4 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Payable Amount:</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#10b981" }}>{ETB(o.grandTotal)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSettleOrder(o);
                      setSettleMethod("Cash");
                      setSettleAmountPaid(String(o.grandTotal));
                    }}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <BadgeDollarSign size={15} />
                    Settle &amp; Convert to Cash Sale
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          REFERENCE SALE DETAILS MODAL: Displays Products & Financial Details
         ══════════════════════════════════════════════════════════ */}
      {refOrder && (
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
          onClick={() => setRefOrder(null)}
        >
          <div
            style={{
              background: "linear-gradient(135deg,#0c1533,#0f1f4d)",
              border: "1.5px solid rgba(16,185,129,0.35)",
              borderRadius: 20,
              padding: 26,
              width: "100%",
              maxWidth: 640,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>
                    Sale Reference #{refOrder.orderNo}
                  </h3>
                  <span
                    style={{
                      background: "rgba(16,185,129,0.15)",
                      border: "1px solid rgba(16,185,129,0.4)",
                      color: "#34d399",
                      padding: "2px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    ✓ Paid / Completed
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  Table: <strong style={{ color: "#38bdf8" }}>{refOrder.tableNo || "Counter"}</strong> | Waiter:{" "}
                  <strong style={{ color: "#c084fc" }}>{refOrder.waiterName || "—"}</strong> | Cashier:{" "}
                  <strong style={{ color: "#fff" }}>{refOrder.cashierName}</strong> | Method:{" "}
                  <strong style={{ color: "#fbbf24" }}>{refOrder.paymentMethod}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRefOrder(null)}
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

            {/* Ordered Products Table */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                    <th style={{ padding: "8px 12px" }}>Product Code</th>
                    <th style={{ padding: "8px 12px" }}>Product Name</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Qty</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Unit Price</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(refOrder.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "8px 12px", color: "#38bdf8", fontWeight: 700 }}>
                        #{it.productCode || "—"}
                      </td>
                      <td style={{ padding: "8px 12px", color: "#ffffff", fontWeight: 600 }}>
                        {it.productName}
                        {it.notes && (
                          <div style={{ fontSize: 10, color: "#fbbf24", fontStyle: "italic", marginTop: 2 }}>
                            ↳ {it.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 800, color: "#e2e8f0" }}>
                        {it.quantity}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#94a3b8" }}>
                        {ETB(it.unitPrice)}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 800, color: "#10b981" }}>
                        {ETB(it.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Details */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                <span>Subtotal: {ETB(refOrder.subtotal)}</span>
                {refOrder.discountAmount > 0 && (
                  <span style={{ marginLeft: 10, color: "#fbbf24" }}>Discount: -{ETB(refOrder.discountAmount)}</span>
                )}
                <span style={{ marginLeft: 10 }}>Tax: {ETB(refOrder.taxAmount)}</span>
                {refOrder.amountPaid > 0 && (
                  <span style={{ marginLeft: 10, color: "#60a5fa" }}>Tendered: {ETB(refOrder.amountPaid)}</span>
                )}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#10b981" }}>
                TOTAL: {ETB(refOrder.grandTotal)}
              </div>
            </div>

            {/* Action Buttons: REPRINT RECEIPT & CLOSE */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() =>
                  posPrint.printReceipt(refOrder, {
                    hotelName: "Baba Roti Café",
                    taxRate: refOrder.taxPercent || 15,
                    isReprint: true,
                  })
                }
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(59,130,246,0.5)",
                  background: "rgba(59,130,246,0.15)",
                  color: "#60a5fa",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Printer size={14} />
                Reprint Receipt
              </button>

              <button
                type="button"
                onClick={() => setRefOrder(null)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#e2e8f0",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SETTLEMENT MODAL (Settle pending captain order into sale)
         ══════════════════════════════════════════════════════════ */}
      {settleOrder && (
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
          onClick={() => setSettleOrder(null)}
        >
          <div
            style={{
              background: "linear-gradient(135deg,#0c1533,#0f1f4d)",
              border: "1.5px solid rgba(16,185,129,0.35)",
              borderRadius: 20,
              padding: 26,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>
                  Settle Order #{settleOrder.orderNo}
                </h3>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  Table: {settleOrder.tableNo || "Counter"} | Waiter: {settleOrder.waiterName || "Staff"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettleOrder(null)}
                style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "#94a3b8", cursor: "pointer", padding: 6 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Total */}
            <div
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1.5px solid rgba(16,185,129,0.25)",
                borderRadius: 14,
                padding: "12px 16px",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4, textTransform: "uppercase", fontWeight: 700 }}>
                Total Payable
              </p>
              <p style={{ fontWeight: 900, fontSize: 26, color: "#10b981", margin: 0 }}>
                {ETB(settleOrder.grandTotal)}
              </p>
            </div>

            {/* Methods */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
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
                    border: settleMethod === m ? `2px solid ${clr}` : "1.5px solid rgba(255,255,255,0.1)",
                    background:
                      settleMethod === m
                        ? `rgba(${clr === "#10b981" ? "16,185,129" : clr === "#6366f1" ? "99,102,241" : "245,158,11"},0.15)`
                        : "rgba(255,255,255,0.04)",
                    color: settleMethod === m ? clr : "#94a3b8",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                  }}
                  onClick={() => setSettleMethod(m)}
                >
                  <Icon size={18} />
                  {m}
                </button>
              ))}
            </div>

            {/* Cash Tender */}
            {settleMethod === "Cash" && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>
                  Cash Tendered (ETB)
                </p>
                <input
                  type="number"
                  value={settleAmountPaid}
                  onChange={(e) => setSettleAmountPaid(e.target.value)}
                  placeholder={String(settleOrder.grandTotal)}
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
                {settleChange > 0 && (
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
                    <span>{ETB(settleChange)}</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={settling}
              onClick={handleSettleOrder}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                border: "none",
                background: settling ? "#374151" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
                cursor: settling ? "not-allowed" : "pointer",
                boxShadow: "0 6px 20px rgba(16,185,129,0.4)",
              }}
            >
              {settling ? "Deducting Stock & Completing Sale..." : "Confirm & Print Receipt"}
            </button>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
