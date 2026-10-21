import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BabaRotiLogo from '../ui/BabaRotiLogo';

// ── Material UI Icons (@mui/icons-material) ──────────────────────────
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import LayersRoundedIcon from '@mui/icons-material/LayersRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import MoveToInboxRoundedIcon from '@mui/icons-material/MoveToInboxRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import WbTwilightRoundedIcon from '@mui/icons-material/WbTwilightRounded';
import BedtimeRoundedIcon from '@mui/icons-material/BedtimeRounded';
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CoffeeRoundedIcon from '@mui/icons-material/CoffeeRounded';
import WidgetsRoundedIcon from '@mui/icons-material/WidgetsRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import ScaleRoundedIcon from '@mui/icons-material/ScaleRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ShoppingBagRoundedIcon from '@mui/icons-material/ShoppingBagRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import SpaRoundedIcon from '@mui/icons-material/SpaRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';

// ── Submenu Link Definitions ──────────────────────────────────────────
const STOCK_ITEMS = [
  { to: '/transactions', label: 'All Movements', icon: SwapHorizRoundedIcon, end: true },
  { to: '/transactions/cash-grv', label: 'Cash Goods Receiving', icon: ShoppingBagRoundedIcon },
  { to: '/transactions/credit-grv', label: 'Credit Goods Receiving', icon: CreditCardRoundedIcon },
  { to: '/transactions/fresh-bazaar', label: 'Fresh Bazaar Receiving', icon: SpaRoundedIcon },
  { to: '/transactions/pos-adjustment', label: 'Positive Adjustment', icon: TrendingUpRoundedIcon },
  { to: '/transactions/disposal', label: 'Goods Disposal', icon: LocalFireDepartmentRoundedIcon },
  { to: '/transactions/neg-adjustment', label: 'Negative Adjustment', icon: TrendingDownRoundedIcon },
  { to: '/sales-import', label: 'Import Sales Report', icon: CloudUploadRoundedIcon },
];

const REPORT_ITEMS = [
  { to: '/reports/summary', label: 'Overview Summary', icon: AssessmentRoundedIcon },
  { to: '/reports/stock-balance', label: 'Stock Balance Sheet', icon: ScaleRoundedIcon },
  { to: '/reports/inventory-count', label: 'Inventory Count', icon: FactCheckRoundedIcon },
  { to: '/reports/daily', label: 'Daily Report', icon: CalendarMonthRoundedIcon },
  { to: '/reports/cash-grv', label: 'Cash GRV Report', icon: ShoppingBagRoundedIcon },
  { to: '/reports/credit-grv', label: 'Credit GRV Report', icon: CreditCardRoundedIcon },
  { to: '/reports/fresh-bazaar', label: 'Fresh Bazaar Report', icon: SpaRoundedIcon },
  { to: '/reports/pos-adjustment', label: '+ve Adjustment Report', icon: TrendingUpRoundedIcon },
  { to: '/reports/disposal', label: 'Disposal Report', icon: LocalFireDepartmentRoundedIcon },
  { to: '/reports/neg-adjustment', label: '−ve Adjustment Report', icon: TrendingDownRoundedIcon },
  { to: '/reports/stock-levels', label: 'Stock Levels', icon: WidgetsRoundedIcon },
  { to: '/reports/purchases', label: 'Purchase History', icon: HistoryRoundedIcon },
];

/* ── Sub-item Link ── */
const SubLink = ({ to, label, icon: Icon, end = false, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
        isActive
          ? 'bg-blue-600/35 text-white font-semibold shadow-sm border border-blue-400/30'
          : 'text-blue-200/70 hover:bg-white/10 hover:text-white'
      }`
    }
  >
    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-blue-300 group-hover:text-white transition-colors">
      <Icon sx={{ fontSize: 16 }} />
    </span>
    <span className="truncate">{label}</span>
  </NavLink>
);

/* ── Section Label (OPERATIONS, ADMIN) with subtle divider ── */
const SectionLabel = ({ children, collapsed }) =>
  collapsed ? (
    <div className="my-2.5 mx-2 border-t border-white/10" />
  ) : (
    <div className="px-3 pt-4 pb-1.5 flex items-center gap-2.5 select-none">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-300/50">
        {children}
      </span>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-400/20 via-blue-400/5 to-transparent" />
    </div>
  );

/* ── Collapsible Menu Group ── */
const CollapsibleNav = ({
  label,
  subtitle,
  icon: Icon,
  iconGradient,
  iconShadow,
  isActive,
  open,
  onToggle,
  children,
  collapsed,
}) => (
  <div>
    <button
      type="button"
      onClick={onToggle}
      title={collapsed ? label : undefined}
      className={`group w-full flex items-center gap-3 rounded-2xl p-2 text-left transition-all duration-200 cursor-pointer ${
        collapsed ? 'justify-center p-2' : ''
      } ${
        isActive
          ? 'bg-gradient-to-r from-[#2952e3] via-[#2447d9] to-[#1e3bbd] text-white shadow-[0_8px_22px_rgba(37,99,235,0.42)] ring-1 ring-white/20 border border-blue-400/30'
          : 'text-slate-200 hover:bg-white/[0.07] hover:text-white border border-transparent'
      }`}
    >
      {/* Colorful Rounded Icon Box */}
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-105 ${
          isActive ? 'ring-2 ring-white/40' : ''
        }`}
        style={{
          background: iconGradient,
          boxShadow: iconShadow,
        }}
      >
        <Icon sx={{ fontSize: 22 }} />
      </span>

      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold tracking-tight text-white leading-tight">
              {label}
            </p>
            {subtitle && (
              <p className={`text-[10.5px] truncate leading-tight mt-0.5 ${
                isActive ? 'text-blue-100/90 font-medium' : 'text-blue-200/60'
              }`}>
                {subtitle}
              </p>
            )}
          </div>
          <span
            className={`flex items-center justify-center text-blue-200/60 transition-transform duration-200 group-hover:text-white ${
              open ? 'rotate-90 text-white' : ''
            }`}
          >
            <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
          </span>
        </>
      )}
    </button>

    {open && !collapsed && (
      <div className="mt-1.5 ml-4 pl-3 py-1 space-y-0.5 border-l-2 border-blue-500/30 rounded-r-xl bg-blue-950/20 backdrop-blur-sm">
        {children}
      </div>
    )}
  </div>
);

/* ── Standalone Navigation Link ── */
const MenuLink = ({
  to,
  label,
  subtitle,
  icon: Icon,
  iconGradient,
  iconShadow,
  end = false,
  collapsed = false,
  onClick,
}) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `group flex items-center gap-3 rounded-2xl p-2 transition-all duration-200 cursor-pointer ${
        collapsed ? 'justify-center p-2' : ''
      } ${
        isActive
          ? 'bg-gradient-to-r from-[#2952e3] via-[#2447d9] to-[#1e3bbd] text-white shadow-[0_8px_22px_rgba(37,99,235,0.42)] ring-1 ring-white/20 border border-blue-400/30'
          : 'text-slate-200 hover:bg-white/[0.07] hover:text-white border border-transparent'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {/* Colorful Rounded Icon Box */}
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-105 ${
            isActive ? 'ring-2 ring-white/40' : ''
          }`}
          style={{
            background: iconGradient,
            boxShadow: iconShadow,
          }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </span>

        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold tracking-tight text-white leading-tight">
                {label}
              </p>
              {subtitle && (
                <p className={`text-[10.5px] truncate leading-tight mt-0.5 ${
                  isActive ? 'text-blue-100/90 font-medium' : 'text-blue-200/60'
                }`}>
                  {subtitle}
                </p>
              )}
            </div>
            <span className="flex items-center justify-center text-blue-200/50 group-hover:text-white group-hover:translate-x-0.5 transition-all">
              <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
            </span>
          </>
        )}
      </>
    )}
  </NavLink>
);

/* ══════════════════════════════════════════
   COMING SOON MODAL — Stock Issue & Request
══════════════════════════════════════════ */
const COMING_SOON_FEATURES = [
  {
    icon: FactCheckRoundedIcon,
    color: 'from-blue-500 to-indigo-600',
    title: 'Stock Request',
    desc: 'Kitchen, Bar & Housekeeping request items from the main store with quantity and urgency level.',
  },
  {
    icon: MoveToInboxRoundedIcon,
    color: 'from-emerald-500 to-teal-600',
    title: 'Stock Issue / Dispatch',
    desc: 'Main store approves and issues requested stock to branches. Auto-deducts from main inventory.',
  },
  {
    icon: SyncAltRoundedIcon,
    color: 'from-violet-500 to-purple-600',
    title: 'Branch-to-Branch Transfer',
    desc: 'Transfer excess stock between departments (e.g. Bar → Kitchen) with full audit trail.',
  },
  {
    icon: HistoryRoundedIcon,
    color: 'from-amber-500 to-orange-600',
    title: 'Issue & Request History',
    desc: 'Full log of all inter-department stock movements with status tracking (Pending → Approved → Issued).',
  },
];

const StockIssueComingSoonModal = ({ onClose }) => (
  <div
    className="fixed inset-0 z-[999] flex items-center justify-center p-4"
    style={{ background: 'rgba(3, 7, 24, 0.75)', backdropFilter: 'blur(8px)' }}
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-blue-500/30 text-white shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header gradient */}
      <div
        className="relative px-7 pt-8 pb-6 text-center"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 60%, #6d28d9 100%)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition cursor-pointer"
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </button>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-xl">
          <MoveToInboxRoundedIcon sx={{ fontSize: 34 }} className="text-white" />
        </div>

        <h2 className="text-xl font-black text-white leading-tight">Stock Issue & Request</h2>
        <p className="mt-1 text-sm text-blue-100 font-medium">Inter-department stock workflow</p>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold text-white border border-white/30">
          <RocketLaunchRoundedIcon sx={{ fontSize: 14 }} />
          Under Active Development
        </div>
      </div>

      {/* Feature list */}
      <div className="px-6 py-5 space-y-3 bg-[#081028]">
        <p className="text-[11px] font-bold text-blue-300/70 uppercase tracking-wider mb-1">
          What is being built
        </p>
        {COMING_SOON_FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 hover:bg-white/[0.07] transition"
          >
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-md`}
            >
              <f.icon sx={{ fontSize: 20 }} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight">{f.title}</p>
              <p className="text-xs text-blue-200/70 mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-2 bg-[#081028]">
        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════
   MAIN SIDEBAR COMPONENT
══════════════════════════════════════════ */
const Sidebar = ({ open, onClose, collapsed = false }) => {
  const { user, canSeeNav } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Active route helpers
  const onTransactions =
    location.pathname.startsWith('/transactions') || location.pathname === '/sales-import';
  const onReports = location.pathname.startsWith('/reports');
  const onInventory = ['/materials', '/products', '/suppliers', '/consumption'].some((p) =>
    location.pathname.startsWith(p)
  );
  const onFinance =
    location.pathname.startsWith('/expenses') || location.pathname.startsWith('/analytics');
  const onStaff =
    location.pathname.startsWith('/users') || location.pathname.startsWith('/employees');
  const onSubsystem = ['/pos', '/captain-order', '/cash-sales'].some((p) =>
    location.pathname.startsWith(p)
  );

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

  // Dynamic greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good Morning', emoji: '☀️' };
    if (hour >= 12 && hour < 18) return { text: 'Good Afternoon', emoji: '🌤️' };
    return { text: 'Good Evening', emoji: '🌙' };
  };
  const greeting = getGreeting();

  // ── Flyout Popout Menu (for Collapsed Mode) ───────────────────────
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

  // Submenu items
  const subsystemItems = [
    canSeeNav('captainOrder') && { to: '/captain-order', label: 'Captain Order', icon: ReceiptLongRoundedIcon },
    canSeeNav('cashSales') && { to: '/cash-sales', label: 'Cash Sales', icon: PaidRoundedIcon },
    canSeeNav('pos') && { to: '/pos', label: 'POS Ordering', icon: PointOfSaleRoundedIcon },
  ].filter(Boolean);

  const inventoryItems = [
    canSeeNav('rawMaterials') && { to: '/materials', label: 'Raw Materials', icon: WidgetsRoundedIcon },
    canSeeNav('products') && { to: '/products', label: 'Products & Recipes', icon: RestaurantMenuRoundedIcon },
    canSeeNav('suppliers') && { to: '/suppliers', label: 'Suppliers Directory', icon: LocalShippingRoundedIcon },
    canSeeNav('consumption') && { to: '/consumption', label: 'Consumption', icon: CoffeeRoundedIcon },
  ].filter(Boolean);

  const financeItems = [
    canSeeNav('expenses') && { to: '/expenses', label: 'Overhead Expenses', icon: ReceiptLongRoundedIcon },
    canSeeNav('analytics') && { to: '/analytics', label: 'Analytics & P&L', icon: TrendingUpRoundedIcon },
  ].filter(Boolean);

  const staffItems = [
    { to: '/users', label: 'Staff Accounts', icon: PeopleAltRoundedIcon },
    { to: '/employees', label: 'Employees Directory', icon: ManageAccountsRoundedIcon },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`
          fixed z-50 flex h-full flex-col
          transition-all duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          ${collapsed ? 'w-[76px]' : 'w-[280px]'}
        `}
        style={{
          background: 'linear-gradient(180deg, #071233 0%, #060e28 50%, #04091c 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '4px 0 30px rgba(2, 6, 23, 0.6)',
        }}
      >
        {/* Ambient Radial Highlights */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-1/2 -left-20 h-52 w-52 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
          />
        </div>

        {/* ── TOP HEADER SECTION ── */}
        <div className="relative pt-4 pb-3 px-3.5 border-b border-white/[0.07]">
          {/* Row 1: Logo & Action Icons */}
          <div className="flex items-center justify-between gap-2">
            <NavLink
              to="/"
              onClick={onClose}
              className={`flex items-center transition-transform hover:scale-[1.02] ${
                collapsed ? 'mx-auto' : ''
              }`}
            >
              <BabaRotiLogo
                collapsed={collapsed}
                size={collapsed ? 36 : 40}
                subtitle="Café & Bakery"
              />
            </NavLink>

            {/* Quick Action Circular Buttons (Notifications & Profile) */}
            {!collapsed && (
              <div className="flex items-center gap-1.5">
                {/* Notification Bell Button */}
                <button
                  type="button"
                  onClick={() => navigate('/settings?tab=telegram')}
                  title="Notifications & Alerts"
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 text-white/90 transition-all cursor-pointer"
                >
                  <NotificationsNoneRoundedIcon sx={{ fontSize: 17 }} />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#071233]" />
                </button>

                {/* Profile Shortcut Button */}
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  title="User Profile"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 text-white/90 transition-all cursor-pointer"
                >
                  <PersonOutlineRoundedIcon sx={{ fontSize: 17 }} />
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Greeting Text (Reference image: Good Morning ☀️ / Manage your restaurant with ease) */}
          {!collapsed && (
            <div className="mt-3 select-none">
              <h3 className="text-[14px] font-extrabold text-white tracking-tight flex items-center gap-1.5">
                {greeting.text} <span>{greeting.emoji}</span>
              </h3>
              <p className="text-[11px] font-medium text-blue-200/60 leading-tight mt-0.5">
                Manage your restaurant with ease
              </p>
            </div>
          )}
        </div>

        {/* ── NAVIGATION MENU (SCROLLABLE) ── */}
        <nav className="relative flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden p-2.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {/* 1. Dashboard */}
          {canSeeNav('dashboard') && (
            <div
              onMouseEnter={(e) =>
                openFlyout(
                  {
                    title: 'Dashboard',
                    icon: DashboardRoundedIcon,
                    items: [{ to: '/', label: 'Overview & Metrics', icon: DashboardRoundedIcon, end: true }],
                  },
                  e
                )
              }
              onMouseLeave={scheduleCloseFlyout}
            >
              <MenuLink
                to="/"
                label="Dashboard"
                subtitle="Overview and key metrics"
                icon={DashboardRoundedIcon}
                iconGradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                iconShadow="0 4px 14px rgba(99, 102, 241, 0.4)"
                end={true}
                collapsed={collapsed}
                onClick={onClose}
              />
            </div>
          )}

          {/* 2. Subsystem (POS, Captain Order, Cash Sales) */}
          {canSeeNav('subsystem') && (
            collapsed ? (
              <div
                onMouseEnter={(e) =>
                  openFlyout(
                    {
                      title: 'Subsystem',
                      icon: LayersRoundedIcon,
                      items: subsystemItems,
                    },
                    e
                  )
                }
                onMouseLeave={scheduleCloseFlyout}
              >
                <MenuLink
                  to="/pos"
                  label="Subsystem"
                  icon={LayersRoundedIcon}
                  iconGradient="linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)"
                  iconShadow="0 4px 14px rgba(37, 99, 235, 0.4)"
                  collapsed={true}
                  onClick={onClose}
                />
              </div>
            ) : (
              <CollapsibleNav
                label="Subsystem"
                subtitle="System modules and services"
                icon={LayersRoundedIcon}
                iconGradient="linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)"
                iconShadow="0 4px 14px rgba(37, 99, 235, 0.4)"
                isActive={onSubsystem}
                open={subsystemOpen}
                onToggle={() => setSubsystemOpen((o) => !o)}
                collapsed={collapsed}
              >
                {canSeeNav('captainOrder') && (
                  <SubLink to="/captain-order" label="Captain Order" icon={ReceiptLongRoundedIcon} onClick={onClose} />
                )}
                {canSeeNav('cashSales') && (
                  <SubLink to="/cash-sales" label="Cash Sales" icon={PaidRoundedIcon} onClick={onClose} />
                )}
                {canSeeNav('pos') && (
                  <SubLink to="/pos" label="POS Ordering" icon={PointOfSaleRoundedIcon} onClick={onClose} />
                )}
              </CollapsibleNav>
            )
          )}

          {/* 3. Inventory & Items */}
          {(canSeeNav('rawMaterials') || canSeeNav('products') || canSeeNav('suppliers') || canSeeNav('consumption')) && (
            collapsed ? (
              <div
                onMouseEnter={(e) =>
                  openFlyout(
                    {
                      title: 'Inventory & Items',
                      icon: Inventory2RoundedIcon,
                      items: inventoryItems,
                    },
                    e
                  )
                }
                onMouseLeave={scheduleCloseFlyout}
              >
                <MenuLink
                  to="/materials"
                  label="Inventory & Items"
                  icon={Inventory2RoundedIcon}
                  iconGradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
                  iconShadow="0 4px 14px rgba(16, 185, 129, 0.4)"
                  collapsed={true}
                  onClick={onClose}
                />
              </div>
            ) : (
              <CollapsibleNav
                label="Inventory & Items"
                subtitle="Products and stock balances"
                icon={Inventory2RoundedIcon}
                iconGradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
                iconShadow="0 4px 14px rgba(16, 185, 129, 0.4)"
                isActive={onInventory}
                open={inventoryOpen}
                onToggle={() => setInventoryOpen((o) => !o)}
                collapsed={collapsed}
              >
                {canSeeNav('rawMaterials') && (
                  <SubLink to="/materials" label="Raw Materials" icon={WidgetsRoundedIcon} onClick={onClose} />
                )}
                {canSeeNav('products') && (
                  <SubLink to="/products" label="Products & Recipes" icon={RestaurantMenuRoundedIcon} onClick={onClose} />
                )}
                {canSeeNav('suppliers') && (
                  <SubLink to="/suppliers" label="Suppliers Directory" icon={LocalShippingRoundedIcon} onClick={onClose} />
                )}
                {canSeeNav('consumption') && (
                  <SubLink to="/consumption" label="Consumption" icon={CoffeeRoundedIcon} onClick={onClose} />
                )}
              </CollapsibleNav>
            )
          )}

          {/* ── SECTION: OPERATIONS ── */}
          <SectionLabel collapsed={collapsed}>Operations</SectionLabel>

          {/* 4. Stock Movements */}
          {canSeeNav('stockMovements') && (
            collapsed ? (
              <div
                onMouseEnter={(e) =>
                  openFlyout(
                    {
                      title: 'Stock Movements',
                      icon: SwapHorizRoundedIcon,
                      items: STOCK_ITEMS,
                    },
                    e
                  )
                }
                onMouseLeave={scheduleCloseFlyout}
              >
                <MenuLink
                  to="/transactions"
                  label="Stock Movements"
                  icon={SwapHorizRoundedIcon}
                  iconGradient="linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)"
                  iconShadow="0 4px 14px rgba(244, 63, 94, 0.4)"
                  collapsed={true}
                  onClick={onClose}
                />
              </div>
            ) : (
              <CollapsibleNav
                label="Stock Movements"
                subtitle="Stock transfers and adjustments"
                icon={SwapHorizRoundedIcon}
                iconGradient="linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)"
                iconShadow="0 4px 14px rgba(244, 63, 94, 0.4)"
                isActive={onTransactions}
                open={stockOpen}
                onToggle={() => setStockOpen((o) => !o)}
                collapsed={collapsed}
              >
                {STOCK_ITEMS.map((item) => (
                  <SubLink key={item.to} {...item} onClick={onClose} />
                ))}
              </CollapsibleNav>
            )
          )}

          {/* 5. Stock Issue & Request */}
          <div
            onMouseEnter={(e) =>
              openFlyout(
                {
                  title: 'Stock Issue & Request',
                  icon: MoveToInboxRoundedIcon,
                  items: [{ to: '/stock-requests', label: 'Store Requisition', icon: MoveToInboxRoundedIcon }],
                },
                e
              )
            }
            onMouseLeave={scheduleCloseFlyout}
          >
            <MenuLink
              to="/stock-requests"
              label="Stock Issue & Request"
              subtitle="Store requisition and dispatch"
              icon={MoveToInboxRoundedIcon}
              iconGradient="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
              iconShadow="0 4px 14px rgba(245, 158, 11, 0.4)"
              collapsed={collapsed}
              onClick={onClose}
            />
          </div>

          {/* 6. Reports */}
          {canSeeNav('reports') && (
            collapsed ? (
              <div
                onMouseEnter={(e) =>
                  openFlyout(
                    {
                      title: 'Reports',
                      icon: AssessmentRoundedIcon,
                      items: REPORT_ITEMS,
                    },
                    e
                  )
                }
                onMouseLeave={scheduleCloseFlyout}
              >
                <MenuLink
                  to="/reports"
                  label="Reports"
                  icon={AssessmentRoundedIcon}
                  iconGradient="linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)"
                  iconShadow="0 4px 14px rgba(6, 182, 212, 0.4)"
                  collapsed={true}
                  onClick={onClose}
                />
              </div>
            ) : (
              <CollapsibleNav
                label="Reports"
                subtitle="Analytics and business insights"
                icon={AssessmentRoundedIcon}
                iconGradient="linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)"
                iconShadow="0 4px 14px rgba(6, 182, 212, 0.4)"
                isActive={onReports}
                open={reportOpen}
                onToggle={() => setReportOpen((o) => !o)}
                collapsed={collapsed}
              >
                {REPORT_ITEMS.map((item) => (
                  <SubLink key={item.to} {...item} onClick={onClose} />
                ))}
              </CollapsibleNav>
            )
          )}

          {/* 7. Finance & Expenses */}
          {(canSeeNav('expenses') || canSeeNav('analytics')) && (
            collapsed ? (
              <div
                onMouseEnter={(e) =>
                  openFlyout(
                    {
                      title: 'Finance & Expenses',
                      icon: SavingsRoundedIcon,
                      items: financeItems,
                    },
                    e
                  )
                }
                onMouseLeave={scheduleCloseFlyout}
              >
                <MenuLink
                  to="/expenses"
                  label="Finance & Expenses"
                  icon={SavingsRoundedIcon}
                  iconGradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
                  iconShadow="0 4px 14px rgba(168, 85, 247, 0.4)"
                  collapsed={true}
                  onClick={onClose}
                />
              </div>
            ) : (
              <CollapsibleNav
                label="Finance & Expenses"
                subtitle="Overhead expenses and P&L"
                icon={SavingsRoundedIcon}
                iconGradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
                iconShadow="0 4px 14px rgba(168, 85, 247, 0.4)"
                isActive={onFinance}
                open={financeOpen}
                onToggle={() => setFinanceOpen((o) => !o)}
                collapsed={collapsed}
              >
                {canSeeNav('expenses') && (
                  <SubLink to="/expenses" label="Overhead Expenses" icon={ReceiptLongRoundedIcon} onClick={onClose} />
                )}
                {canSeeNav('analytics') && (
                  <SubLink to="/analytics" label="Analytics & P&L" icon={TrendingUpRoundedIcon} onClick={onClose} />
                )}
              </CollapsibleNav>
            )
          )}

          {/* ── SECTION: ADMIN ── */}
          <SectionLabel collapsed={collapsed}>Admin</SectionLabel>

          {/* 8. Staff & Employees */}
          {canSeeNav('staffAccounts') && (
            collapsed ? (
              <div
                onMouseEnter={(e) =>
                  openFlyout(
                    {
                      title: 'Staff & Employees',
                      icon: PeopleAltRoundedIcon,
                      items: staffItems,
                    },
                    e
                  )
                }
                onMouseLeave={scheduleCloseFlyout}
              >
                <MenuLink
                  to="/users"
                  label="Staff & Employees"
                  icon={PeopleAltRoundedIcon}
                  iconGradient="linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)"
                  iconShadow="0 4px 14px rgba(56, 189, 248, 0.4)"
                  collapsed={true}
                  onClick={onClose}
                />
              </div>
            ) : (
              <CollapsibleNav
                label="Staff & Employees"
                subtitle="Staff administration"
                icon={PeopleAltRoundedIcon}
                iconGradient="linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)"
                iconShadow="0 4px 14px rgba(56, 189, 248, 0.4)"
                isActive={onStaff}
                open={staffOpen}
                onToggle={() => setStaffOpen((o) => !o)}
                collapsed={collapsed}
              >
                <SubLink to="/users" label="Staff Accounts" icon={PeopleAltRoundedIcon} onClick={onClose} />
                <SubLink to="/employees" label="Employees Directory" icon={ManageAccountsRoundedIcon} onClick={onClose} />
              </CollapsibleNav>
            )
          )}

          {/* 9. Settings */}
          <div
            onMouseEnter={(e) =>
              openFlyout(
                {
                  title: 'Settings',
                  icon: SettingsRoundedIcon,
                  items: [{ to: '/settings', label: 'System Configurations', icon: SettingsRoundedIcon }],
                },
                e
              )
            }
            onMouseLeave={scheduleCloseFlyout}
          >
            <MenuLink
              to="/settings"
              label="Settings"
              subtitle="System configurations"
              icon={SettingsRoundedIcon}
              iconGradient="linear-gradient(135deg, #475569 0%, #64748b 100%)"
              iconShadow="0 4px 14px rgba(100, 116, 139, 0.4)"
              collapsed={collapsed}
              onClick={onClose}
            />
          </div>

          {/* 10. Recycle Bin */}
          {(canSeeNav('staffAccounts') || user?.role === 'admin' || user?.role === 'manager') && (
            <div
              onMouseEnter={(e) =>
                openFlyout(
                  {
                    title: 'Recycle Bin',
                    icon: DeleteSweepRoundedIcon,
                    items: [{ to: '/recycle-bin', label: 'Recycle Bin & Restores', icon: DeleteSweepRoundedIcon }],
                  },
                  e
                )
              }
              onMouseLeave={scheduleCloseFlyout}
            >
              <MenuLink
                to="/recycle-bin"
                label="Recycle Bin"
                subtitle="Restore deleted records"
                icon={DeleteSweepRoundedIcon}
                iconGradient="linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
                iconShadow="0 4px 14px rgba(239, 68, 68, 0.4)"
                collapsed={collapsed}
                onClick={onClose}
              />
            </div>
          )}
        </nav>

        {/* ── BOTTOM USER PROFILE CARD (MATCHING REFERENCE IMAGE 1) ── */}
        <div className="p-3 border-t border-white/[0.07]">
          <div
            onClick={() => navigate('/profile')}
            onMouseEnter={(e) =>
              openFlyout(
                {
                  title: user?.name || 'Hotel Admin',
                  subtitle: user?.role ? user.role.toUpperCase() : 'ADMIN',
                  icon: PeopleAltRoundedIcon,
                  items: [
                    { to: '/profile', label: 'My Profile', icon: PersonOutlineRoundedIcon },
                    { to: '/settings', label: 'System Settings', icon: SettingsRoundedIcon },
                  ],
                },
                e
              )
            }
            onMouseLeave={scheduleCloseFlyout}
            className={`group relative flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-200 cursor-pointer ${
              collapsed ? 'justify-center p-2' : ''
            } bg-gradient-to-r from-blue-950/60 to-blue-900/30 border border-blue-400/20 hover:border-blue-400/40 hover:bg-white/[0.08] shadow-[0_4px_16px_rgba(2,6,23,0.5)]`}
          >
            {/* Avatar with Circular Amber Accent & Green Online Indicator */}
            <div className="relative shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20"
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full font-black text-white text-base shadow-md"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }}
                >
                  {user?.name?.[0]?.toUpperCase() || 'H'}
                </div>
              )}
              {/* Online Green Indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#071233]" />
            </div>

            {/* User Name & Yellow Pill Role Badge */}
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-white leading-tight">
                    {user?.name || 'Hotel Admin'}
                  </p>
                  <span className="mt-1 inline-flex items-center rounded-full bg-amber-400/20 border border-amber-400/35 px-2 py-0.5 text-[10px] font-bold text-amber-300 capitalize tracking-wide">
                    {user?.role || 'Admin'}
                  </span>
                </div>
                <span className="text-blue-300/40 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                  <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                </span>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── FLYOUT POPOUT MENU FOR COLLAPSED MODE (MATCHING REFERENCE IMAGE 2) ── */}
      {collapsed && flyout && (
        <div
          onMouseEnter={keepFlyout}
          onMouseLeave={closeFlyoutImmediately}
          style={{
            position: 'fixed',
            left: `${(flyout.rect?.right || 76) + 8}px`,
            top: `${Math.max(
              12,
              Math.min(
                window.innerHeight - Math.min((flyout.items?.length || 1) * 44 + 65, 480) - 12,
                (flyout.rect?.top || 0) - 4
              )
            )}px`,
            zIndex: 9999,
            minWidth: '240px',
            maxWidth: '300px',
            background: 'linear-gradient(170deg, #071233 0%, #0a1b52 100%)',
            border: '1px solid rgba(99, 130, 255, 0.35)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0, 5, 30, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            color: '#fff',
            overflow: 'hidden',
          }}
        >
          {/* Flyout Header */}
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              {flyout.icon && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.25)',
                    color: '#93c5fd',
                  }}
                >
                  <flyout.icon sx={{ fontSize: 16 }} />
                </span>
              )}
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                {flyout.title}
              </span>
            </div>
            {flyout.subtitle ? (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#93c5fd',
                  background: 'rgba(59, 130, 246, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '12px',
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
                  padding: '2px 7px',
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
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '380px',
              overflowY: 'auto',
            }}
            className="scrollbar-thin scrollbar-thumb-white/10"
          >
            {(flyout.items || []).map((sub) => {
              const SubIcon = sub.icon || CircleRoundedIcon;
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
                    `group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-md'
                        : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-blue-300 group-hover:text-white transition-colors">
                    <SubIcon sx={{ fontSize: 16 }} />
                  </span>
                  <span className="flex-1 truncate text-[12.5px]">{sub.label}</span>
                  <ChevronRightRoundedIcon
                    sx={{ fontSize: 16 }}
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
