import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Boxes, ShoppingCart,
  ArrowLeftRight, FileBarChart, Users, UtensilsCrossed,
  ChevronDown, ChevronRight, CircleDot,
  ShoppingBag, CreditCard, Leaf, TrendingUp, Flame, TrendingDown,
  BarChart2, Calendar, PackageOpen, Settings as SettingsIcon, UploadCloud,
  Scale, ClipboardList, Trash2, Coffee, UserCog,
  SendToBack, X, Rocket, ClipboardCheck, ArrowRightLeft, History, Receipt,
  MonitorSmartphone, ClipboardPen, BadgeDollarSign, Layers3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BabaRotiLogo from '../ui/BabaRotiLogo';

const STOCK_ITEMS = [
  { to: '/transactions', label: 'All Movements', icon: ArrowLeftRight, end: true },
  { to: '/transactions/cash-grv', label: 'Cash Goods Receiving', icon: ShoppingBag },
  { to: '/transactions/credit-grv', label: 'Credit Goods Receiving', icon: CreditCard },
  { to: '/transactions/fresh-bazaar', label: 'Fresh Bazaar Receiving', icon: Leaf },
  { to: '/transactions/pos-adjustment', label: 'Positive Adjustment', icon: TrendingUp },
  { to: '/transactions/disposal', label: 'Goods Disposal', icon: Flame },
  { to: '/transactions/neg-adjustment', label: 'Negative Adjustment', icon: TrendingDown },
  { to: '/sales-import', label: 'Import Sales Report', icon: UploadCloud },
];

const REPORT_ITEMS = [
  { to: '/reports/summary', label: 'Overview', icon: BarChart2 },
  { to: '/reports/stock-balance', label: 'Stock Balance Sheet', icon: Scale },
  { to: '/reports/inventory-count', label: 'Inventory Count', icon: ClipboardList },
  { to: '/reports/daily', label: 'Daily Report', icon: Calendar },
  { to: '/reports/cash-grv', label: 'Cash GRV Report', icon: ShoppingBag },
  { to: '/reports/credit-grv', label: 'Credit GRV Report', icon: CreditCard },
  { to: '/reports/fresh-bazaar', label: 'Fresh Bazaar Report', icon: Leaf },
  { to: '/reports/pos-adjustment', label: '+ve Adjustment Report', icon: TrendingUp },
  { to: '/reports/disposal', label: 'Disposal Report', icon: Flame },
  { to: '/reports/neg-adjustment', label: '−ve Adjustment Report', icon: TrendingDown },
  { to: '/reports/stock-levels', label: 'Stock Levels', icon: PackageOpen },
  { to: '/reports/purchases', label: 'Purchase History', icon: ShoppingCart },
];

/* ── Sub-item link ── */
const SubLink = ({ to, label, icon: Icon, end = false, onClick }) => (
  <NavLink to={to} end={end} onClick={onClick}
    className={({ isActive }) =>
      `group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${isActive
        ? 'bg-white/15 text-white font-semibold'
        : 'text-blue-300/80 hover:bg-white/8 hover:text-white'
      }`
    }
  >
    <span className="h-1 w-1 rounded-full bg-current opacity-50 group-hover:opacity-100 transition-opacity" />
    <Icon size={12} className="shrink-0" />
    {label}
  </NavLink>
);

/* ── Section label ── */
const SectionLabel = ({ children, collapsed }) =>
  collapsed ? <div className="my-2 border-t border-white/10" /> : (
    <p className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-blue-400/60 select-none">
      {children}
    </p>
  );

/* ── Collapsible section with '>' indicator ── */
const CollapsibleNav = ({ label, icon: Icon, isActive, open, onToggle, children, collapsed }) => (
  <div>
    <button
      type="button"
      onClick={onToggle}
      title={collapsed ? label : undefined}
      className={`group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
        collapsed ? 'justify-center' : ''
      } ${
        isActive
          ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
          : 'text-blue-100/80 hover:bg-white/8 hover:text-white'
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${
          isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-blue-200 group-hover:bg-white/10 group-hover:text-white'
        }`}
      >
        <Icon size={15} strokeWidth={2} />
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left text-[13px]">{label}</span>
          <span
            className={`transition-transform duration-200 text-blue-300/70 group-hover:text-white ${
              open ? 'rotate-90' : ''
            }`}
          >
            <ChevronRight size={13} strokeWidth={2.5} />
          </span>
        </>
      )}
    </button>
    {open && !collapsed && (
      <div className="mt-1 ml-5 border-l border-white/10 pl-2.5 space-y-0.5">
        {children}
      </div>
    )}
  </div>
);

/* ══════════════════════════════════════════
   COMING SOON MODAL — Stock Issue & Request
══════════════════════════════════════════ */
const COMING_SOON_FEATURES = [
  {
    icon: ClipboardCheck,
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    title: 'Stock Request',
    desc: 'Kitchen, Bar & Housekeeping request items from the main store with quantity and urgency level.',
  },
  {
    icon: SendToBack,
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    title: 'Stock Issue / Dispatch',
    desc: 'Main store approves and issues requested stock to branches. Auto-deducts from main inventory.',
  },
  {
    icon: ArrowRightLeft,
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    title: 'Branch-to-Branch Transfer',
    desc: 'Transfer excess stock between departments (e.g. Bar → Kitchen) with full audit trail.',
  },
  {
    icon: History,
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    title: 'Issue & Request History',
    desc: 'Full log of all inter-department stock movements with status tracking (Pending → Approved → Issued).',
  },
];

const StockIssueComingSoonModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
    onClick={onClose}>
    <div
      className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header gradient */}
      <div className="relative px-7 pt-8 pb-6 text-center"
        style={{ background: 'linear-gradient(135deg, #1a56db 0%, #4f46e5 60%, #7c3aed 100%)' }}>
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition">
          <X size={15} />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
          <SendToBack size={30} className="text-white" />
        </div>

        <h2 className="text-xl font-black text-white leading-tight">
          Stock Issue & Request
        </h2>
        <p className="mt-1.5 text-sm text-blue-200 font-medium">
          Inter-department stock workflow — coming soon
        </p>

        {/* Coming soon badge */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-white border border-white/30">
          <Rocket size={11} />
          Under Development
        </div>
      </div>

      {/* Feature list */}
      <div className="px-6 py-5 space-y-3">
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">
          What's being built
        </p>
        {COMING_SOON_FEATURES.map((f) => (
          <div key={f.title}
            className="flex items-start gap-3.5 rounded-2xl border border-ink-100 bg-ink-50/40 p-3.5 hover:bg-ink-50 transition">
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-sm`}>
              <f.icon size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink-900 leading-tight">{f.title}</p>
              <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <button onClick={onClose}
          className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white hover:from-blue-700 hover:to-indigo-700 transition shadow-sm">
          Got it, notify me when ready
        </button>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════ */
const Sidebar = ({ open, onClose, collapsed = false }) => {
  const { user, canSeeNav } = useAuth();
  const location = useLocation();

  const onTransactions = location.pathname.startsWith('/transactions') || location.pathname === '/sales-import';
  const onReports = location.pathname.startsWith('/reports');
  const onInventory = ['/materials', '/products', '/suppliers', '/consumption'].some(p => location.pathname.startsWith(p));
  const onFinance = location.pathname.startsWith('/expenses') || location.pathname.startsWith('/analytics');
  const onStaff = location.pathname.startsWith('/users') || location.pathname.startsWith('/employees');
  const onSubsystem = ['/pos', '/captain-order', '/cash-sales'].some(p => location.pathname.startsWith(p));

  const [stockOpen, setStockOpen] = useState(onTransactions);
  const [reportOpen, setReportOpen] = useState(onReports);
  const [inventoryOpen, setInventoryOpen] = useState(onInventory);
  const [financeOpen, setFinanceOpen] = useState(onFinance);
  const [staffOpen, setStaffOpen] = useState(onStaff);
  const [subsystemOpen, setSubsystemOpen] = useState(onSubsystem);

  useEffect(() => {
    if (onTransactions) setStockOpen(true);
    if (onReports) setReportOpen(true);
    if (onInventory) setInventoryOpen(true);
    if (onFinance) setFinanceOpen(true);
    if (onStaff) setStaffOpen(true);
    if (onSubsystem) setSubsystemOpen(true);
  }, [location.pathname]);

  // ── Flyout Popout Menu (for Collapsed / Toggle Mode) ──────────────
  const [flyout, setFlyout] = useState(null);
  const flyoutTimerRef = useRef(null);

  const openFlyout = (itemData, e) => {
    if (!collapsed) return;
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyout({ ...itemData, rect });
  };

  const scheduleCloseFlyout = () => {
    if (!collapsed) return;
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    flyoutTimerRef.current = setTimeout(() => {
      setFlyout(null);
    }, 180);
  };

  const keepFlyout = () => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
  };

  const closeFlyoutImmediately = () => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    setFlyout(null);
  };

  useEffect(() => {
    closeFlyoutImmediately();
  }, [location.pathname, collapsed]);

  // Submenu items definitions
  const subsystemItems = [
    canSeeNav('captainOrder') && { to: '/captain-order', label: 'Captain Order', icon: ClipboardPen },
    canSeeNav('cashSales') && { to: '/cash-sales', label: 'Cash Sales', icon: BadgeDollarSign },
    canSeeNav('pos') && { to: '/pos', label: 'POS Ordering', icon: MonitorSmartphone },
  ].filter(Boolean);

  const inventoryItems = [
    canSeeNav('rawMaterials') && { to: '/materials', label: 'Raw Materials', icon: Boxes },
    canSeeNav('products') && { to: '/products', label: 'Products', icon: UtensilsCrossed },
    canSeeNav('suppliers') && { to: '/suppliers', label: 'Suppliers', icon: Truck },
    canSeeNav('consumption') && { to: '/consumption', label: 'Consumption', icon: Coffee },
  ].filter(Boolean);

  const financeItems = [
    canSeeNav('expenses') && { to: '/expenses', label: 'Overhead Expenses', icon: Receipt },
    canSeeNav('analytics') && { to: '/analytics', label: 'Analytics & P&L', icon: TrendingUp },
  ].filter(Boolean);

  const staffItems = [
    { to: '/users', label: 'Staff Accounts', icon: Users },
    { to: '/employees', label: 'Employees Directory', icon: UserCog },
  ];

  const linkCls = (isActive) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${collapsed ? 'justify-center' : ''
    } ${isActive
      ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
      : 'text-blue-100/80 hover:bg-white/8 hover:text-white'
    }`;

  const iconSpan = (isActive) =>
    `flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
    }`;

  const fullLink = (to, Icon, label, end = false) => (
    <NavLink to={to} end={end} onClick={onClose}
      className={({ isActive }) => linkCls(isActive)}>
      {({ isActive }) => (
        <>
          <span className={iconSpan(isActive)}><Icon size={15} strokeWidth={2} /></span>
          {!collapsed && <span className="text-[13px]">{label}</span>}
          {isActive && !collapsed && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
          )}
        </>
      )}
    </NavLink>
  );

  const iconLink = (to, Icon, label, end = false) => (
    <NavLink to={to} end={end} onClick={onClose} title={label}
      className={({ isActive }) => linkCls(isActive)}>
      {({ isActive }) => (
        <span className={iconSpan(isActive)}><Icon size={15} strokeWidth={2} /></span>
      )}
    </NavLink>
  );

  const navLink = (to, Icon, label, end = false, flyoutItems = null) => {
    if (collapsed) {
      const items = flyoutItems || [{ to, label, icon: Icon, end }];
      return (
        <div
          onMouseEnter={(e) => openFlyout({ title: label, icon: Icon, items }, e)}
          onMouseLeave={scheduleCloseFlyout}
        >
          {iconLink(to, Icon, label, end)}
        </div>
      );
    }
    return fullLink(to, Icon, label, end);
  };

  const roleColors = {
    admin: 'from-amber-400 to-orange-500',
    manager: 'from-emerald-400 to-teal-500',
    storekeeper: 'from-blue-400 to-indigo-500',
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside
        className={`
          fixed z-40 flex h-full flex-col
          transition-all duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'w-[68px]' : 'w-64'}
        `}
        style={{
          background: 'linear-gradient(160deg, #060d2b 0%, #0a1a52 40%, #0d2680 70%, #1238a8 100%)',
          borderRight: '1px solid rgba(99,130,255,0.15)',
          boxShadow: '4px 0 24px rgba(0,0,50,0.4)',
        }}
      >
        {/* ── Decorative glow orbs ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #4f8ef7 0%, transparent 70%)' }} />
          <div className="absolute bottom-20 -right-16 h-48 w-48 rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        </div>

        {/* ── Logo ── */}
        <NavLink
          to="/"
          onClick={onClose}
          className={`relative flex items-center py-4 transition-all hover:opacity-95 ${
            collapsed ? 'justify-center px-2' : 'px-4'
          }`}
        >
          <BabaRotiLogo
            collapsed={collapsed}
            size={collapsed ? 36 : 40}
            subtitle="Café & Bakery"
          />
        </NavLink>

        {/* ── Nav ── */}
        <nav className="relative flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 pb-4
          scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">

          <SectionLabel collapsed={collapsed}>Main</SectionLabel>
          {canSeeNav('dashboard') && navLink('/', LayoutDashboard, 'Dashboard', true, [
            { to: '/', label: 'Overview & Metrics', icon: LayoutDashboard, end: true }
          ])}

          {/* ── Subsystem (POS + Captain Order + Cash Sales) ── */}
          {/* canSeeNav('subsystem') returns false for non-dev users when the module is disabled by the developer */}
          {canSeeNav('subsystem') && (
            collapsed ? (
              <div
                onMouseEnter={(e) => openFlyout({ title: 'Subsystem', icon: Layers3, items: subsystemItems }, e)}
                onMouseLeave={scheduleCloseFlyout}
              >
                <NavLink to="/pos" onClick={onClose} title="Subsystem"
                  className={({ isActive }) => linkCls(isActive || onSubsystem)}>
                  {({ isActive }) => (
                    <span className={iconSpan(isActive || onSubsystem)}>
                      <Layers3 size={15} strokeWidth={2} />
                    </span>
                  )}
                </NavLink>
              </div>
            ) : (
              <CollapsibleNav
                label="Subsystem"
                icon={Layers3}
                isActive={onSubsystem}
                open={subsystemOpen}
                onToggle={() => setSubsystemOpen(o => !o)}
                collapsed={collapsed}
              >
                {canSeeNav('captainOrder') && (
                  <SubLink to="/captain-order" label="Captain Order" icon={ClipboardPen} onClick={onClose} />
                )}
                {canSeeNav('cashSales') && (
                  <SubLink to="/cash-sales" label="Cash Sales" icon={BadgeDollarSign} onClick={onClose} />
                )}
                {canSeeNav('pos') && (
                  <SubLink to="/pos" label="POS Ordering" icon={MonitorSmartphone} onClick={onClose} />
                )}
              </CollapsibleNav>
            )
          )}

          {/* ── Inventory & Items Group ── */}
          {(canSeeNav('rawMaterials') || canSeeNav('products') || canSeeNav('suppliers') || canSeeNav('consumption')) && (
            collapsed ? (
              <div
                onMouseEnter={(e) => openFlyout({ title: 'Inventory & Items', icon: Boxes, items: inventoryItems }, e)}
                onMouseLeave={scheduleCloseFlyout}
              >
                <NavLink
                  to="/materials"
                  onClick={onClose}
                  title="Inventory & Items"
                  className={({ isActive }) => linkCls(isActive || onInventory)}
                >
                  {({ isActive }) => (
                    <span className={iconSpan(isActive || onInventory)}>
                      <Boxes size={15} strokeWidth={2} />
                    </span>
                  )}
                </NavLink>
              </div>
            ) : (
              <CollapsibleNav
                label="Inventory & Items"
                icon={Boxes}
                isActive={onInventory}
                open={inventoryOpen}
                onToggle={() => setInventoryOpen((o) => !o)}
                collapsed={collapsed}
              >
                {canSeeNav('rawMaterials') && (
                  <SubLink to="/materials" label="Raw Materials" icon={Boxes} onClick={onClose} />
                )}
                {canSeeNav('products') && (
                  <SubLink to="/products" label="Products" icon={UtensilsCrossed} onClick={onClose} />
                )}
                {canSeeNav('suppliers') && (
                  <SubLink to="/suppliers" label="Suppliers" icon={Truck} onClick={onClose} />
                )}
                {canSeeNav('consumption') && (
                  <SubLink to="/consumption" label="Consumption" icon={Coffee} onClick={onClose} />
                )}
              </CollapsibleNav>
            )
          )}

          <SectionLabel collapsed={collapsed}>Operations</SectionLabel>

          {/* Stock Movements */}
          {canSeeNav('stockMovements') && (
            collapsed ? (
              <div
                onMouseEnter={(e) => openFlyout({ title: 'Stock Movements', icon: ArrowLeftRight, items: STOCK_ITEMS }, e)}
                onMouseLeave={scheduleCloseFlyout}
              >
                <NavLink to="/transactions" onClick={onClose} title="Stock Movements"
                  className={({ isActive }) => linkCls(isActive || onTransactions)}>
                  {({ isActive }) => (
                    <span className={iconSpan(isActive || onTransactions)}>
                      <ArrowLeftRight size={15} strokeWidth={2} />
                    </span>
                  )}
                </NavLink>
              </div>
            ) : (
              <CollapsibleNav label="Stock Movements" icon={ArrowLeftRight}
                isActive={onTransactions} open={stockOpen}
                onToggle={() => setStockOpen(o => !o)} collapsed={collapsed}>
                {STOCK_ITEMS.map(item => <SubLink key={item.to} {...item} onClick={onClose} />)}
              </CollapsibleNav>
            )
          )}

          {/* Stock Issue & Request */}
          {navLink('/stock-requests', SendToBack, 'Stock Issue & Request', false, [
            { to: '/stock-requests', label: 'Stock Issue & Request', icon: SendToBack }
          ])}

          {/* Reports */}
          {canSeeNav('reports') && (
            collapsed ? (
              <div
                onMouseEnter={(e) => openFlyout({ title: 'Reports', icon: FileBarChart, items: REPORT_ITEMS }, e)}
                onMouseLeave={scheduleCloseFlyout}
              >
                <NavLink to="/reports" onClick={onClose} title="Reports"
                  className={({ isActive }) => linkCls(isActive || onReports)}>
                  {({ isActive }) => (
                    <span className={iconSpan(isActive || onReports)}>
                      <FileBarChart size={15} strokeWidth={2} />
                    </span>
                  )}
                </NavLink>
              </div>
            ) : (
              <CollapsibleNav label="Reports" icon={FileBarChart}
                isActive={onReports} open={reportOpen}
                onToggle={() => setReportOpen(o => !o)} collapsed={collapsed}>
                {REPORT_ITEMS.map(item => <SubLink key={item.to} {...item} onClick={onClose} />)}
              </CollapsibleNav>
            )
          )}

          {/* ── Finance & Expenses Group ── */}
          {(canSeeNav('expenses') || canSeeNav('analytics')) && (
            collapsed ? (
              <div
                onMouseEnter={(e) => openFlyout({ title: 'Finance & Expenses', icon: Receipt, items: financeItems }, e)}
                onMouseLeave={scheduleCloseFlyout}
              >
                <NavLink
                  to="/expenses"
                  onClick={onClose}
                  title="Finance & Expenses"
                  className={({ isActive }) => linkCls(isActive || onFinance)}
                >
                  {({ isActive }) => (
                    <span className={iconSpan(isActive || onFinance)}>
                      <Receipt size={15} strokeWidth={2} />
                    </span>
                  )}
                </NavLink>
              </div>
            ) : (
              <CollapsibleNav
                label="Finance & Expenses"
                icon={Receipt}
                isActive={onFinance}
                open={financeOpen}
                onToggle={() => setFinanceOpen((o) => !o)}
                collapsed={collapsed}
              >
                {canSeeNav('expenses') && (
                  <SubLink to="/expenses" label="Overhead Expenses" icon={Receipt} onClick={onClose} />
                )}
                {canSeeNav('analytics') && (
                  <SubLink to="/analytics" label="Analytics & P&L" icon={TrendingUp} onClick={onClose} />
                )}
              </CollapsibleNav>
            )
          )}

          <SectionLabel collapsed={collapsed}>Admin</SectionLabel>

          {/* ── Staff & Employees Group (Collapsible >) ── */}
          {canSeeNav('staffAccounts') && (
            collapsed ? (
              <div
                onMouseEnter={(e) => openFlyout({ title: 'Staff & Employees', icon: Users, items: staffItems }, e)}
                onMouseLeave={scheduleCloseFlyout}
              >
                <NavLink
                  to="/users"
                  onClick={onClose}
                  title="Staff & Employees"
                  className={({ isActive }) => linkCls(isActive || onStaff)}
                >
                  {({ isActive }) => (
                    <span className={iconSpan(isActive || onStaff)}>
                      <Users size={15} strokeWidth={2} />
                    </span>
                  )}
                </NavLink>
              </div>
            ) : (
              <CollapsibleNav
                label="Staff & Employees"
                icon={Users}
                isActive={onStaff}
                open={staffOpen}
                onToggle={() => setStaffOpen((o) => !o)}
                collapsed={collapsed}
              >
                <SubLink to="/users" label="Staff Accounts" icon={Users} onClick={onClose} />
                <SubLink to="/employees" label="Employees Directory" icon={UserCog} onClick={onClose} />
              </CollapsibleNav>
            )
          )}

          {navLink('/settings', SettingsIcon, 'Settings', false, [
            { to: '/settings', label: 'System Settings', icon: SettingsIcon }
          ])}

          {/* Recycle Bin */}
          {(canSeeNav('staffAccounts') || user?.role === 'admin' || user?.role === 'manager') && (
            collapsed ? (
              <div
                onMouseEnter={(e) => openFlyout({
                  title: 'Recycle Bin',
                  icon: Trash2,
                  items: [{ to: '/recycle-bin', label: 'Recycle Bin & Restores', icon: Trash2 }]
                }, e)}
                onMouseLeave={scheduleCloseFlyout}
              >
                <NavLink to="/recycle-bin" onClick={onClose} title="Recycle Bin"
                  className={({ isActive }) =>
                    `group flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/20'
                        : 'text-red-400/60 hover:bg-red-500/10 hover:text-red-300'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${
                      isActive ? 'bg-red-500/25' : 'bg-red-500/10 group-hover:bg-red-500/15'
                    }`}>
                      <Trash2 size={14} strokeWidth={2} />
                    </span>
                  )}
                </NavLink>
              </div>
            ) : (
              <NavLink to="/recycle-bin" onClick={onClose} title="Recycle Bin"
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/20'
                      : 'text-red-400/60 hover:bg-red-500/10 hover:text-red-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${
                      isActive ? 'bg-red-500/25' : 'bg-red-500/10 group-hover:bg-red-500/15'
                    }`}>
                      <Trash2 size={14} strokeWidth={2} />
                    </span>
                    <span className="text-[13px]">Recycle Bin</span>
                  </>
                )}
              </NavLink>
            )
          )}
        </nav>

        {/* ── User card ── */}
        <div
          onMouseEnter={(e) => openFlyout({
            title: user?.name || 'Staff User',
            subtitle: user?.role ? user.role.toUpperCase() : 'USER',
            icon: Users,
            items: [
              { to: '/settings', label: 'My Profile & Settings', icon: SettingsIcon },
            ]
          }, e)}
          onMouseLeave={scheduleCloseFlyout}
          className={`relative mx-2 mb-4 overflow-hidden rounded-xl p-3
            flex items-center gap-3 transition-all
            ${collapsed ? 'justify-center cursor-pointer hover:bg-white/10' : ''}
            `}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}>
          {/* Avatar */}
          <div className="relative shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name}
                className="h-9 w-9 rounded-xl object-cover ring-2 ring-white/20" />
            ) : (
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white text-sm
                bg-gradient-to-br ${roleColors[user?.role] || 'from-blue-400 to-indigo-500'}`}
                title={user?.name}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0d2680]" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-white leading-tight">{user?.name}</p>
              <p className="capitalize text-[10px] leading-tight mt-0.5">
                <span className={`inline-block rounded-full px-1.5 py-0.5 font-semibold
                  bg-gradient-to-r ${roleColors[user?.role] || 'from-blue-400 to-indigo-500'}
                  text-white text-[9px]`}>
                  {user?.role}
                </span>
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Collapsed Flyout Popout Menu (Matches Second System Reference) ── */}
      {collapsed && flyout && (
        <div
          onMouseEnter={keepFlyout}
          onMouseLeave={closeFlyoutImmediately}
          style={{
            position: 'fixed',
            left: `${(flyout.rect?.right || 68) + 4}px`,
            top: `${Math.max(
              10,
              Math.min(
                window.innerHeight - Math.min((flyout.items?.length || 1) * 38 + 60, 420) - 10,
                (flyout.rect?.top || 0) - 4
              )
            )}px`,
            zIndex: 9999,
            minWidth: '220px',
            maxWidth: '280px',
            background: 'linear-gradient(165deg, #071238 0%, #0a1b52 100%)',
            border: '1px solid rgba(99, 130, 255, 0.35)',
            borderRadius: '14px',
            boxShadow: '0 20px 50px rgba(0, 5, 30, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            color: '#fff',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {flyout.icon && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    color: '#93c5fd',
                  }}
                >
                  <flyout.icon size={13} strokeWidth={2.5} />
                </span>
              )}
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.4px', color: '#ffffff' }}>
                {flyout.title}
              </span>
            </div>
            {flyout.subtitle ? (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#93c5fd',
                  background: 'rgba(59, 130, 246, 0.25)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  letterSpacing: '0.5px',
                }}
              >
                {flyout.subtitle}
              </span>
            ) : flyout.items?.length > 1 ? (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#93c5fd',
                  background: 'rgba(59, 130, 246, 0.25)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {flyout.items.length}
              </span>
            ) : null}
          </div>

          {/* Sub-item Links */}
          <div
            style={{
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              maxHeight: '360px',
              overflowY: 'auto',
            }}
            className="scrollbar-thin scrollbar-thumb-white/10"
          >
            {(flyout.items || []).map((sub) => {
              const SubIcon = sub.icon || CircleDot;
              return (
                <NavLink
                  key={sub.to}
                  to={sub.to}
                  end={sub.end}
                  onClick={() => {
                    closeFlyoutImmediately();
                    onClose?.();
                  }}
                  className={({ isActive }) =>
                    `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-md'
                        : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-blue-300 group-hover:text-white transition-colors">
                    <SubIcon size={13} strokeWidth={2.2} />
                  </span>
                  <span className="flex-1 truncate text-[12.5px]">{sub.label}</span>
                  <ChevronRight
                    size={12}
                    className="ml-auto text-blue-300/40 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                  />
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
