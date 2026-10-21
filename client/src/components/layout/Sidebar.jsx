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

/* ── Sub-item Link (Compact & Refined) ── */
const SubLink = ({ to, label, icon: Icon, end = false, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `group flex items-center gap-2 rounded-lg px-2 py-1 text-[11px] font-medium transition-all duration-150 ${
        isActive
          ? 'bg-blue-600/35 text-white font-semibold shadow-xs border border-blue-400/30'
          : 'text-blue-200/65 hover:bg-white/10 hover:text-white'
      }`
    }
  >
    <span className="flex h-4 w-4 shrink-0 items-center justify-center text-blue-300 group-hover:text-white transition-colors">
      <Icon sx={{ fontSize: 13 }} />
    </span>
    <span className="truncate">{label}</span>
  </NavLink>
);

/* ── Section Label (OPERATIONS, ADMIN) with subtle divider ── */
const SectionLabel = ({ children, collapsed }) =>
  collapsed ? (
    <div className="my-1.5 mx-2 border-t border-white/10" />
  ) : (
    <div className="px-2 pt-2 pb-0.5 flex items-center gap-2 select-none">
      <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-blue-300/40">
        {children}
      </span>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-400/20 via-blue-400/5 to-transparent" />
    </div>
  );

/* ── Collapsible Menu Group (Compact & Proportional) ── */
const CollapsibleNav = ({
  label,
  subtitle,
  icon: Icon,
  iconGradient,
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
      className={`group w-full flex items-center gap-2 rounded-xl py-1 px-1.5 text-left transition-all duration-150 cursor-pointer ${
        collapsed ? 'justify-center py-1.5 px-0' : ''
      } ${
        isActive
          ? 'bg-gradient-to-r from-[#2952e3] via-[#2447d9] to-[#1e3bbd] text-white shadow-[0_3px_12px_rgba(37,99,235,0.38)] ring-1 ring-white/20 border border-blue-400/30'
          : 'text-slate-200 hover:bg-white/[0.07] hover:text-white border border-transparent'
      }`}
    >
      {/* Sleek Compact Rounded Icon Box (28px) */}
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white transition-transform duration-150 group-hover:scale-105 ${
          isActive ? 'ring-1.5 ring-white/40' : ''
        }`}
        style={{
          background: iconGradient,
          boxShadow: '0 2px 6px rgba(0,0,0,0.22)',
        }}
      >
        <Icon sx={{ fontSize: 16 }} />
      </span>

      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold tracking-tight text-white leading-tight">
              {label}
            </p>
            {subtitle && (
              <p
                className={`text-[9.5px] truncate leading-tight mt-0.5 ${
                  isActive ? 'text-blue-100/90 font-medium' : 'text-blue-200/50'
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
          <span
            className={`flex items-center justify-center text-blue-200/40 transition-transform duration-150 group-hover:text-white ${
              open ? 'rotate-90 text-white' : ''
            }`}
          >
            <ChevronRightRoundedIcon sx={{ fontSize: 14 }} />
          </span>
        </>
      )}
    </button>

    {open && !collapsed && (
      <div className="mt-0.5 ml-3 pl-2 py-0.5 space-y-0.5 border-l-2 border-blue-500/30 rounded-r-lg bg-blue-950/20 backdrop-blur-xs">
        {children}
      </div>
    )}
  </div>
);

/* ── Standalone Navigation Link (Compact & Proportional) ── */
const MenuLink = ({
  to,
  label,
  subtitle,
  icon: Icon,
  iconGradient,
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
      `group flex items-center gap-2 rounded-xl py-1 px-1.5 transition-all duration-150 cursor-pointer ${
        collapsed ? 'justify-center py-1.5 px-0' : ''
      } ${
        isActive
          ? 'bg-gradient-to-r from-[#2952e3] via-[#2447d9] to-[#1e3bbd] text-white shadow-[0_3px_12px_rgba(37,99,235,0.38)] ring-1 ring-white/20 border border-blue-400/30'
          : 'text-slate-200 hover:bg-white/[0.07] hover:text-white border border-transparent'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {/* Sleek Compact Rounded Icon Box (28px) */}
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white transition-transform duration-150 group-hover:scale-105 ${
            isActive ? 'ring-1.5 ring-white/40' : ''
          }`}
          style={{
            background: iconGradient,
            boxShadow: '0 2px 6px rgba(0,0,0,0.22)',
          }}
        >
          <Icon sx={{ fontSize: 16 }} />
        </span>

        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold tracking-tight text-white leading-tight">
                {label}
              </p>
              {subtitle && (
                <p
                  className={`text-[9.5px] truncate leading-tight mt-0.5 ${
                    isActive ? 'text-blue-100/90 font-medium' : 'text-blue-200/50'
                  }`}
                >
                  {subtitle}
                </p>
              )}
            </div>
            <span className="flex items-center justify-center text-blue-200/35 group-hover:text-white group-hover:translate-x-0.5 transition-all">
              <ChevronRightRoundedIcon sx={{ fontSize: 14 }} />
            </span>
          </>
        )}
      </>
    )}
  </NavLink>
);

/* ══════════════════════════════════════════
   SIDEBAR COMPONENT
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

      {/* Main Sidebar Element (Streamlined & Compact) */}
      <aside
        className={`
          fixed z-50 flex h-full flex-col
          transition-all duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          ${collapsed ? 'w-[64px]' : 'w-[242px]'}
        `}
        style={{
          background: 'linear-gradient(180deg, #071233 0%, #060e28 50%, #04091c 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '4px 0 25px rgba(2, 6, 23, 0.55)',
        }}
      >
        {/* Ambient Subtle Highlights */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-1/2 -left-16 h-44 w-44 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
          />
        </div>

        {/* ── TOP HEADER SECTION (COMPACT) ── */}
        <div className="relative pt-2.5 pb-2 px-2.5 border-b border-white/[0.07]">
          {/* Row 1: Logo & Quick Action Buttons */}
          <div className="flex items-center justify-between gap-1.5">
            <NavLink
              to="/"
              onClick={onClose}
              className={`flex items-center transition-transform hover:scale-[1.02] ${
                collapsed ? 'mx-auto' : ''
              }`}
            >
              <BabaRotiLogo
                collapsed={collapsed}
                size={collapsed ? 28 : 32}
                subtitle="Café & Bakery"
              />
            </NavLink>

            {/* Quick Action Circular Buttons */}
            {!collapsed && (
              <div className="flex items-center gap-1">
                {/* Notification Bell Button */}
                <button
                  type="button"
                  onClick={() => navigate('/settings?tab=telegram')}
                  title="Notifications & Alerts"
                  className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 text-white/90 transition-all cursor-pointer"
                >
                  <NotificationsNoneRoundedIcon sx={{ fontSize: 15 }} />
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500 ring-1 ring-[#071233]" />
                </button>

                {/* Profile Shortcut Button */}
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  title="User Profile"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 text-white/90 transition-all cursor-pointer"
                >
                  <PersonOutlineRoundedIcon sx={{ fontSize: 15 }} />
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Dynamic Greeting Text */}
          {!collapsed && (
            <div className="mt-1.5 select-none">
              <h3 className="text-[12px] font-bold text-white tracking-tight flex items-center gap-1">
                {greeting.text} <span>{greeting.emoji}</span>
              </h3>
              <p className="text-[9.5px] font-medium text-blue-200/50 leading-tight mt-0.5">
                Manage your restaurant with ease
              </p>
            </div>
          )}
        </div>

        {/* ── NAVIGATION MENU (COMPACT & PADDING OPTIMIZED) ── */}
        <nav className="relative flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
                subtitle="Overview & metrics"
                icon={DashboardRoundedIcon}
                iconGradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
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
                  collapsed={true}
                  onClick={onClose}
                />
              </div>
            ) : (
              <CollapsibleNav
                label="Subsystem"
                subtitle="POS, Orders & Sales"
                icon={LayersRoundedIcon}
                iconGradient="linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)"
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
                  collapsed={true}
                  onClick={onClose}
                />
              </div>
            ) : (
              <CollapsibleNav
                label="Inventory & Items"
                subtitle="Stock & products"
                icon={Inventory2RoundedIcon}
                iconGradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
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
                  collapsed={true}
                  onClick={onClose}
                />
              </div>
            ) : (
              <CollapsibleNav
                label="Stock Movements"
                subtitle="Stock transfers"
                icon={SwapHorizRoundedIcon}
                iconGradient="linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)"
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
              subtitle="Requisition & dispatch"
              icon={MoveToInboxRoundedIcon}
              iconGradient="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
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
                  collapsed={true}
                  onClick={onClose}
                />
              </div>
            ) : (
              <CollapsibleNav
                label="Reports"
                subtitle="Analytics & insights"
                icon={AssessmentRoundedIcon}
                iconGradient="linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)"
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
                  collapsed={true}
                  onClick={onClose}
                />
              </div>
            ) : (
              <CollapsibleNav
                label="Finance & Expenses"
                subtitle="Expenses & P&L"
                icon={SavingsRoundedIcon}
                iconGradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
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
                  collapsed={true}
                  onClick={onClose}
                />
              </div>
            ) : (
              <CollapsibleNav
                label="Staff & Employees"
                subtitle="Staff directory"
                icon={PeopleAltRoundedIcon}
                iconGradient="linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)"
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
              subtitle="Configurations"
              icon={SettingsRoundedIcon}
              iconGradient="linear-gradient(135deg, #475569 0%, #64748b 100%)"
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
                subtitle="Restore records"
                icon={DeleteSweepRoundedIcon}
                iconGradient="linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
                collapsed={collapsed}
                onClick={onClose}
              />
            </div>
          )}
        </nav>

        {/* ── BOTTOM USER PROFILE CARD (COMPACT) ── */}
        <div className="p-1.5 border-t border-white/[0.07]">
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
            className={`group relative flex items-center gap-2 rounded-xl py-1.5 px-2 transition-all duration-150 cursor-pointer ${
              collapsed ? 'justify-center p-1' : ''
            } bg-gradient-to-r from-blue-950/60 to-blue-900/30 border border-blue-400/20 hover:border-blue-400/40 hover:bg-white/[0.08]`}
          >
            {/* Avatar with Circular Amber Accent & Green Online Indicator (28px) */}
            <div className="relative shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20"
                />
              ) : (
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full font-bold text-white text-[11px] shadow-xs"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }}
                >
                  {user?.name?.[0]?.toUpperCase() || 'H'}
                </div>
              )}
              {/* Online Green Indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-[#071233]" />
            </div>

            {/* User Name & Yellow Pill Role Badge */}
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-bold text-white leading-tight">
                    {user?.name || 'Hotel Admin'}
                  </p>
                  <span className="mt-0.5 inline-flex items-center rounded-full bg-amber-400/20 border border-amber-400/30 px-1.5 py-0.2 text-[8.5px] font-bold text-amber-300 capitalize tracking-wide">
                    {user?.role || 'Admin'}
                  </span>
                </div>
                <span className="text-blue-300/35 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                  <ChevronRightRoundedIcon sx={{ fontSize: 14 }} />
                </span>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── FLYOUT POPOUT MENU FOR COLLAPSED MODE ── */}
      {collapsed && flyout && (
        <div
          onMouseEnter={keepFlyout}
          onMouseLeave={closeFlyoutImmediately}
          style={{
            position: 'fixed',
            left: `${(flyout.rect?.right || 64) + 6}px`,
            top: `${Math.max(
              10,
              Math.min(
                window.innerHeight - Math.min((flyout.items?.length || 1) * 36 + 55, 420) - 10,
                (flyout.rect?.top || 0) - 4
              )
            )}px`,
            zIndex: 9999,
            minWidth: '220px',
            maxWidth: '280px',
            background: 'linear-gradient(170deg, #071233 0%, #0a1b52 100%)',
            border: '1px solid rgba(99, 130, 255, 0.35)',
            borderRadius: '14px',
            boxShadow: '0 15px 40px rgba(0, 5, 30, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            color: '#fff',
            overflow: 'hidden',
          }}
        >
          {/* Flyout Header */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
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
                    background: 'rgba(59, 130, 246, 0.25)',
                    color: '#93c5fd',
                  }}
                >
                  <flyout.icon sx={{ fontSize: 14 }} />
                </span>
              )}
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
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
                  padding: '1.5px 6px',
                  borderRadius: '10px',
                }}
              >
                {flyout.subtitle}
              </span>
            ) : flyout.items?.length > 1 ? (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: '#93c5fd',
                  background: 'rgba(59, 130, 246, 0.25)',
                  padding: '1.5px 6px',
                  borderRadius: '8px',
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
              maxHeight: '340px',
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
                    `group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center text-blue-300 group-hover:text-white transition-colors">
                    <SubIcon sx={{ fontSize: 13 }} />
                  </span>
                  <span className="flex-1 truncate text-[11.5px]">{sub.label}</span>
                  <ChevronRightRoundedIcon
                    sx={{ fontSize: 13 }}
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
