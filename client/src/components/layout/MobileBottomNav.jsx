import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';

/**
 * MobileBottomNav
 * Fixed bottom navigation bar for smartphones matching the reference design.
 * Features: Home, Orders, Inventory, Finance, and More.
 * Displayed exclusively on mobile viewports (lg:hidden).
 */
export default function MobileBottomNav({ onOpenMenu }) {
  const location = useLocation();
  const { canSeeNav } = useAuth();

  const isHomeActive = location.pathname === '/';
  const isOrdersActive = ['/pos', '/captain-order', '/cash-sales'].some((p) =>
    location.pathname.startsWith(p)
  );
  const isInventoryActive = ['/materials', '/products', '/suppliers', '/consumption'].some((p) =>
    location.pathname.startsWith(p)
  );
  const isFinanceActive = ['/expenses', '/analytics', '/reports'].some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-3 py-1.5 flex items-center justify-around shadow-[0_-4px_25px_rgba(0,0,0,0.06)] lg:hidden"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* 1. Home */}
      <NavLink
        to="/"
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
          isHomeActive
            ? 'text-blue-600 font-bold scale-105'
            : 'text-slate-500 hover:text-slate-800 font-medium'
        }`}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
            isHomeActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
          }`}
        >
          <HomeRoundedIcon sx={{ fontSize: 22 }} />
        </span>
        <span className="text-[10px] tracking-tight mt-0.5">Home</span>
      </NavLink>

      {/* 2. Orders (Subsystem Suite) */}
      {canSeeNav('subsystem') && (
        <NavLink
          to="/pos"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
            isOrdersActive
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              isOrdersActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
            }`}
          >
            <ReceiptLongRoundedIcon sx={{ fontSize: 22 }} />
          </span>
          <span className="text-[10px] tracking-tight mt-0.5">Orders</span>
        </NavLink>
      )}

      {/* 3. Inventory */}
      <NavLink
        to="/materials"
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
          isInventoryActive
            ? 'text-blue-600 font-bold scale-105'
            : 'text-slate-500 hover:text-slate-800 font-medium'
        }`}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
            isInventoryActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
          }`}
        >
          <Inventory2RoundedIcon sx={{ fontSize: 22 }} />
        </span>
        <span className="text-[10px] tracking-tight mt-0.5">Inventory</span>
      </NavLink>

      {/* 4. Finance & Expenses */}
      {(canSeeNav('expenses') || canSeeNav('analytics')) && (
        <NavLink
          to="/expenses"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
            isFinanceActive
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              isFinanceActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
            }`}
          >
            <SavingsRoundedIcon sx={{ fontSize: 22 }} />
          </span>
          <span className="text-[10px] tracking-tight mt-0.5">Finance</span>
        </NavLink>
      )}

      {/* 5. More (Opens Mobile Sidebar Drawer) */}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open More Menu"
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-800 font-medium transition-all duration-200 cursor-pointer"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <MoreHorizRoundedIcon sx={{ fontSize: 22 }} />
        </span>
        <span className="text-[10px] tracking-tight mt-0.5">More</span>
      </button>
    </nav>
  );
}
