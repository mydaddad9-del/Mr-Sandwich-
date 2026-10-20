import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axios";
import { posPrint } from "../utils/posPrint";
import {
  Search, Plus, Minus, Trash2, ChevronDown, X, Clock,
  UtensilsCrossed, ShoppingBag, Printer, User, TableProperties,
  RefreshCw, Send, AlertCircle, CheckCircle2, Eye, Edit3,
  ChevronRight, Coffee, Users, Hash, Layers, ReceiptText,
  Calendar, Filter, FileText, Ban, ArrowUpRight, DollarSign,
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

const STATUS_CONFIG = {
  all: { label: "All Orders", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", color: "#cbd5e1" },
  held: { label: "Held", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.35)", color: "#c084fc" },
  open: { label: "Open", bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.35)", color: "#60a5fa" },
  sent_to_kitchen: { label: "In Kitchen", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)", color: "#fbbf24" },
  ready: { label: "Ready", bg: "rgba(20,184,166,0.15)", border: "rgba(20,184,166,0.35)", color: "#2dd4bf" },
  billed: { label: "Billed", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.35)", color: "#818cf8" },
  paid: { label: "Paid", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.35)", color: "#34d399" },
  voided: { label: "Voided", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.35)", color: "#f87171" },
};

export default function CaptainOrder() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [dateVal, setDateVal] = useState(new Date().toISOString().slice(0, 10));
  const [refOrder, setRefOrder] = useState(null); // active order in Reference Details modal
  const [voidModalOrder, setVoidModalOrder] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [toast, setToast] = useState(null);
  const [clock, setClock] = useState(new Date());

  const showToast = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/captain-orders?limit=300`;
      if (dateVal) url += `&date=${dateVal}`;
      if (statusFilter && statusFilter !== "all") url += `&status=${statusFilter}`;
      const res = await api.get(url);
      setOrders(res.data || []);
    } catch (e) {
      showToast("Failed to load captain orders", "error");
    } finally {
      setLoading(false);
    }
  }, [dateVal, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Send to kitchen
  const handleSendToKitchen = async (orderId) => {
    try {
      const res = await api.post(`/captain-orders/${orderId}/send-to-kitchen`);
      posPrint.printKOT(res.data.order, { businessName: "Baba Roti Café" });
      showToast("Order sent to Kitchen & KOT printed!");
      loadOrders();
      if (refOrder?._id === orderId) {
        setRefOrder(res.data.order);
      }
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to send to kitchen", "error");
    }
  };

  // Void order
  const handleVoidOrder = async () => {
    if (!voidModalOrder) return;
    setVoiding(true);
    try {
      const res = await api.post(`/captain-orders/${voidModalOrder._id}/void`, {
        reason: voidReason.trim() || "Voided by Captain / Manager",
      });
      showToast(`Captain Order #${voidModalOrder.orderNo} voided.`, "info");
      setVoidModalOrder(null);
      setVoidReason("");
      if (refOrder?._id === voidModalOrder._id) {
        setRefOrder(res.data.order);
      }
      loadOrders();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to void order", "error");
    } finally {
      setVoiding(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    const matchNo = (o.orderNo || "").toLowerCase().includes(q);
    const matchTable = (o.tableNo || "").toLowerCase().includes(q);
    const matchWaiter = (o.waiterName || "").toLowerCase().includes(q);
    const matchCustomer = (o.customerName || "").toLowerCase().includes(q);
    const matchItem = (o.items || []).some(
      (it) =>
        (it.productName || "").toLowerCase().includes(q) ||
        (it.productCode || "").toLowerCase().includes(q)
    );
    return matchNo || matchTable || matchWaiter || matchCustomer || matchItem;
  });

  // KPI Calculations
  const totalCount = orders.length;
  const heldCount = orders.filter((o) => o.status === "held").length;
  const kitchenCount = orders.filter((o) => o.status === "sent_to_kitchen").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const voidCount = orders.filter((o) => o.status === "voided").length;
  const totalValue = orders.reduce((s, o) => s + (o.grandTotal || 0), 0);

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
        .order-row { transition: all 0.15s ease; }
        .order-row:hover { background: rgba(99,102,241,0.1) !important; transform: translateX(2px); }
        .kpi-card { animation: fadeInUp 0.3s ease both; transition: all 0.2s ease; }
        .kpi-card:hover { transform: translateY(-3px); }
        .ref-btn:hover { background: rgba(59,130,246,0.3) !important; border-color: rgba(59,130,246,0.7) !important; transform: scale(1.02); }
        .status-pill { transition: all 0.15s; }
        .status-pill:hover { transform: scale(1.05); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>

      {/* ── HEADER & TOPBAR ────────────────────────────────────────── */}
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
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 900,
              boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
            }}
          >
            <UtensilsCrossed size={18} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                Captain Orders Status &amp; Tracking Report
              </h2>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: "rgba(245,158,11,0.18)",
                  border: "1px solid rgba(245,158,11,0.4)",
                  color: "#fbbf24",
                  textTransform: "uppercase",
                }}
              >
                ● Floor Dispatch
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              Active table orders, KOT status, held tickets, and floor tracking
            </div>
          </div>
        </div>

        {/* Date & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            onClick={() => loadOrders()}
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

          <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
            {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>
      </header>

      {/* ── PREMIUM KPI METRICS SUMMARY ROW ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 14,
          padding: "16px 20px 0",
        }}
      >
        {[
          {
            label: "Total Orders", count: totalCount, extra: ETB(totalValue),
            color: "#38bdf8", glow: "rgba(56,189,248,0.25)",
            bg: "linear-gradient(135deg, rgba(56,189,248,0.16) 0%, rgba(14,165,233,0.08) 100%)",
            border: "rgba(56,189,248,0.35)", icon: "📊",
          },
          {
            label: "Held Orders", count: heldCount,
            color: "#c084fc", glow: "rgba(192,132,252,0.25)",
            bg: "linear-gradient(135deg, rgba(192,132,252,0.16) 0%, rgba(139,92,246,0.08) 100%)",
            border: "rgba(192,132,252,0.35)", icon: "⏸️",
          },
          {
            label: "In Kitchen (KOT)", count: kitchenCount,
            color: "#fbbf24", glow: "rgba(251,191,36,0.25)",
            bg: "linear-gradient(135deg, rgba(251,191,36,0.16) 0%, rgba(245,158,11,0.08) 100%)",
            border: "rgba(251,191,36,0.35)", icon: "🔥",
          },
          {
            label: "Ready to Serve", count: readyCount,
            color: "#2dd4bf", glow: "rgba(45,212,191,0.25)",
            bg: "linear-gradient(135deg, rgba(45,212,191,0.16) 0%, rgba(20,184,166,0.08) 100%)",
            border: "rgba(45,212,191,0.35)", icon: "✅",
          },
          {
            label: "Voided Orders", count: voidCount,
            color: "#f87171", glow: "rgba(248,113,113,0.25)",
            bg: "linear-gradient(135deg, rgba(248,113,113,0.16) 0%, rgba(239,68,68,0.08) 100%)",
            border: "rgba(248,113,113,0.35)", icon: "❌",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="kpi-card"
            style={{
              background: k.bg,
              border: `1.5px solid ${k.border}`,
              borderRadius: 18,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              position: "relative",
              overflow: "hidden",
              boxShadow: `0 8px 28px ${k.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
              animationDelay: `${i * 0.06}s`,
            }}
          >
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${k.color}, transparent)`,
              borderRadius: "18px 18px 0 0",
            }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
                {k.label}
              </span>
              <span style={{ fontSize: 20 }}>{k.icon}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.count}</span>
              {k.extra && <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", opacity: 0.8 }}>{k.extra}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH & STATUS FILTER TABS ──────────────────────────── */}
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
            placeholder="Search by Product Code, Name, Table #, Waiter, or Order #..."
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

        {/* Status filter pills */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {Object.keys(STATUS_CONFIG).map((s) => {
            const active = statusFilter === s;
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                className="status-pill"
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 50,
                  border: active ? `1.5px solid ${cfg.color}` : "1px solid rgba(255,255,255,0.08)",
                  background: active ? cfg.bg : "rgba(255,255,255,0.03)",
                  color: active ? cfg.color : "#94a3b8",
                  fontWeight: active ? 800 : 600,
                  fontSize: 11,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: active ? `0 0 12px ${cfg.color}44` : "none",
                }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── REPORT TABLE ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <RefreshCw size={32} color="#f59e0b" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 12, color: "#94a3b8", fontSize: 13 }}>Loading Orders Report...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 16,
              border: "1px dashed rgba(255,255,255,0.08)",
            }}
          >
            <FileText size={40} color="#64748b" style={{ opacity: 0.4, marginBottom: 10 }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>No Captain Orders Found</p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Orders created from POS Ordering or Captain Order will be tracked and displayed here.
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
                    <th style={{ padding: "12px 14px" }}>Ordered Products (Code &amp; Name)</th>
                    <th style={{ padding: "12px 14px" }}>Table</th>
                    <th style={{ padding: "12px 14px" }}>Waiter</th>
                    <th style={{ padding: "12px 14px" }}>Time</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>Total</th>
                    <th style={{ padding: "12px 14px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "12px 14px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => {
                    const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.open;
                    const itemsSummary = (o.items || []).map((it) => (
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
                        <span style={{ color: "#fbbf24", fontWeight: 800 }}>x{it.quantity}</span>
                      </span>
                    ));

                    return (
                      <tr
                        key={o._id}
                        className="order-row"
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
                            onClick={() => setRefOrder(o)}
                            title="Click to view all ordered products and order details"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "4px 10px",
                              borderRadius: 8,
                              background: "rgba(59,130,246,0.15)",
                              border: "1px solid rgba(59,130,246,0.4)",
                              color: "#60a5fa",
                              fontWeight: 800,
                              fontSize: 12,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            <FileText size={12} />
                            #{o.orderNo}
                          </button>
                        </td>

                        {/* Ordered Products (Code & Name) */}
                        <td style={{ padding: "12px 14px", verticalAlign: "middle", maxWidth: 360 }}>
                          <div style={{ display: "flex", flexWrap: "wrap" }}>{itemsSummary}</div>
                        </td>

                        {/* Table */}
                        <td style={{ padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              background: "rgba(16,185,129,0.12)",
                              border: "1px solid rgba(16,185,129,0.3)",
                              color: "#34d399",
                              fontWeight: 700,
                              fontSize: 11,
                              padding: "3px 8px",
                              borderRadius: 6,
                            }}
                          >
                            🪑 {o.tableNo || "Counter"}
                          </span>
                        </td>

                        {/* Waiter */}
                        <td style={{ padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <span style={{ color: "#c084fc", fontWeight: 600 }}>
                            👤 {o.waiterName || "Staff"}
                          </span>
                        </td>

                        {/* Time */}
                        <td style={{ padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap", color: "#94a3b8" }}>
                          {new Date(o.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>

                        {/* Total */}
                        <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "right", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 900, color: "#10b981", fontSize: 13 }}>
                            {ETB(o.grandTotal)}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "center", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              background: sc.bg,
                              border: `1px solid ${sc.border}`,
                              color: sc.color,
                              padding: "3px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            {sc.label}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "center", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            {/* View Reference Button */}
                            <button
                              type="button"
                              onClick={() => setRefOrder(o)}
                              title="View Ordered Products & Details"
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

                            {/* Send to Kitchen if Held or Open */}
                            {["held", "open"].includes(o.status) && (
                              <button
                                type="button"
                                onClick={() => handleSendToKitchen(o._id)}
                                title="Send to Kitchen & Print KOT"
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: 8,
                                  border: "none",
                                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                  color: "#000",
                                  fontWeight: 800,
                                  fontSize: 11,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Send size={11} />
                                KOT
                              </button>
                            )}

                            {/* Void button */}
                            {!["paid", "voided", "cancelled"].includes(o.status) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setVoidModalOrder(o);
                                  setVoidReason("");
                                }}
                                title="Void Order"
                                style={{
                                  padding: "5px 8px",
                                  borderRadius: 8,
                                  border: "1px solid rgba(239,68,68,0.3)",
                                  background: "rgba(239,68,68,0.12)",
                                  color: "#f87171",
                                  fontWeight: 600,
                                  fontSize: 11,
                                  cursor: "pointer",
                                }}
                              >
                                <Ban size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          REFERENCE DETAILS MODAL: Displays All Ordered Products
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
              border: "1.5px solid rgba(99,102,241,0.35)",
              borderRadius: 20,
              padding: 26,
              width: "100%",
              maxWidth: 620,
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
                    Order Reference #{refOrder.orderNo}
                  </h3>
                  <span
                    style={{
                      background: STATUS_CONFIG[refOrder.status]?.bg || "rgba(255,255,255,0.1)",
                      border: `1px solid ${STATUS_CONFIG[refOrder.status]?.border || "transparent"}`,
                      color: STATUS_CONFIG[refOrder.status]?.color || "#fff",
                      padding: "2px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                    }}
                  >
                    {STATUS_CONFIG[refOrder.status]?.label || refOrder.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  Table: <strong style={{ color: "#34d399" }}>{refOrder.tableNo || "Counter"}</strong> | Waiter:{" "}
                  <strong style={{ color: "#c084fc" }}>{refOrder.waiterName || "Staff"}</strong> | Created:{" "}
                  {new Date(refOrder.createdAt).toLocaleTimeString()}
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

            {/* Products Table */}
            <div style={{ flex: 1, overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                    <th style={{ padding: "8px 12px" }}>Product Code</th>
                    <th style={{ padding: "8px 12px" }}>Product Name</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Qty</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Unit Price</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Total</th>
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

            {/* Financial breakdown */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                <span>Subtotal: {ETB(refOrder.subtotal)}</span>
                {refOrder.discountAmount > 0 && <span style={{ marginLeft: 10, color: "#fbbf24" }}>Discount: -{ETB(refOrder.discountAmount)}</span>}
                <span style={{ marginLeft: 10 }}>Tax: {ETB(refOrder.taxAmount)}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981" }}>
                TOTAL: {ETB(refOrder.grandTotal)}
              </div>
            </div>

            {/* Modal action buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              {/* Void option */}
              {!["paid", "voided", "cancelled"].includes(refOrder.status) && (
                <button
                  type="button"
                  onClick={() => {
                    setVoidModalOrder(refOrder);
                    setVoidReason("");
                  }}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: "1.5px solid rgba(239,68,68,0.5)",
                    background: "rgba(239,68,68,0.15)",
                    color: "#f87171",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ban size={14} />
                  Void This Order
                </button>
              )}

              {/* Print KOT */}
              <button
                type="button"
                onClick={() => posPrint.printKOT(refOrder, { businessName: "Baba Roti Café" })}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(245,158,11,0.5)",
                  background: "rgba(245,158,11,0.15)",
                  color: "#fbbf24",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Printer size={14} />
                Reprint KOT
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
          VOID ORDER REASON MODAL
         ══════════════════════════════════════════════════════════ */}
      {voidModalOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 700,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setVoidModalOrder(null)}
        >
          <div
            style={{
              background: "#0c1533",
              border: "1.5px solid rgba(239,68,68,0.4)",
              borderRadius: 18,
              padding: 24,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 25px 70px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                }}
              >
                <Ban size={18} />
              </div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>
                Void Captain Order #{voidModalOrder.orderNo}
              </h4>
            </div>

            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
              Are you sure you want to void this order? Please state a reason for restaurant audit logs.
            </p>

            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Reason for voiding (e.g. Guest cancelled, wrong table, mistake)..."
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "rgba(255,255,255,0.05)",
                border: "1.5px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 12,
                outline: "none",
                resize: "none",
                marginBottom: 16,
              }}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setVoidModalOrder(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "#94a3b8",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={voiding}
                onClick={handleVoidOrder}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg,#ef4444,#dc2626)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: voiding ? "not-allowed" : "pointer",
                }}
              >
                {voiding ? "Voiding..." : "Confirm Void"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
