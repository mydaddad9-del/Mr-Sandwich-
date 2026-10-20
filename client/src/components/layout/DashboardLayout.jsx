import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AiChat from '../AiChat';

const titles = {
  '/': 'Dashboard',
  '/materials': 'Raw Materials',
  '/products': 'Sales Products & Recipes',
  '/analytics': 'Analytics & Performance',
  '/transactions': 'Stock Movements',
  '/transactions/cash-grv': 'Cash GRV Entries',
  '/transactions/credit-grv': 'Credit GRV Entries',
  '/transactions/fresh-bazaar': 'Fresh Bazaar Entries',
  '/transactions/pos-adjustment': '+ve Adjustment Entries',
  '/transactions/disposal': 'Goods Disposal Entries',
  '/transactions/neg-adjustment': '−ve Adjustment Entries',
  '/sales-import': 'Sales & POS Import',
  '/purchases': 'Purchases',
  '/suppliers': 'Suppliers Directory',
  '/reports': 'Reports & Analytics',
  '/reports/summary': 'Overview Summary Report',
  '/reports/stock-balance': 'Stock Balance Sheet',
  '/reports/inventory-count': 'Inventory Count',
  '/reports/daily': 'Daily Movement Report',
  '/reports/cash-grv': 'Cash GRV Report',
  '/reports/credit-grv': 'Credit GRV Report',
  '/reports/fresh-bazaar': 'Fresh Bazaar Report',
  '/reports/pos-adjustment': '+ve Adjustment Report',
  '/reports/disposal': 'Goods Disposal Report',
  '/reports/neg-adjustment': '−ve Adjustment Report',
  '/reports/stock-levels': 'Stock Levels Report',
  '/reports/purchases': 'Purchases Report',
  '/users': 'Staff Accounts',
  '/employees': 'Employee Management',
  '/consumption': 'Consumption Management',
  '/settings': 'System Settings',
  '/profile': 'User Profile',
  '/recycle-bin': 'Recycle Bin',
  '/stock-requests': 'Stock Issue & Request',
};
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);  // mobile overlay
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);  // desktop collapse
  const location = useLocation();
  const isPos = location.pathname === '/pos';
  const title = titles[location.pathname] || 'Baba Roti  Café Plc Stock';

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
          title={title}
        />
        {isPos ? (
          <main className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#f8fafc]">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 flex flex-col justify-between"
            style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #f8faff 50%, #ffffff 100%)' }}>
            <div>
              <Outlet />
            </div>
            <footer className="mt-12 pt-6 border-t border-ink-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-400 pb-2">
              <p>© 2026 Baba Roti  CaféHotel Management System · All rights reserved.</p>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span>Developed By <strong className="text-ink-700 font-semibold">Mega Tech Teams</strong></span>
              </div>
            </footer>
          </main>
        )}
      </div>
      {/* AI Chat — floats over every page */}
      <AiChat />
    </div>
  );
};
export default DashboardLayout;
