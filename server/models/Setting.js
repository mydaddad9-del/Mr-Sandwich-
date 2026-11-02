const mongoose = require('mongoose');

const DEFAULT_NAV_VISIBILITY = {
  dashboard: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true },
  pos: { storekeeper: true, cashier: true, waiter: true, supervisor: true, manager: true, admin: true },
  captainOrder: { storekeeper: true, cashier: true, waiter: true, supervisor: true, manager: true, admin: true },
  cashSales: { storekeeper: true, cashier: true, waiter: false, supervisor: true, manager: true, admin: true },
  rawMaterials: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true },
  products: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true },
  stockMovements: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true },
  suppliers: { storekeeper: false, cashier: false, waiter: false, supervisor: true, manager: true, admin: true },
  consumption: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true },
  reports: { storekeeper: false, cashier: false, waiter: false, supervisor: true, manager: true, admin: true },
  expenses: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true },
  analytics: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: true, admin: true },
  staffAccounts: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: false, admin: true },
};

const DEFAULT_CRUD_PERMISSIONS = {
  rawMaterials: { view: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true }, edit: { storekeeper: false, cashier: false, waiter: false, supervisor: true, manager: true, admin: true }, delete: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: false, admin: true } },
  products: { view: { storekeeper: true, cashier: true, waiter: true, supervisor: true, manager: true, admin: true }, edit: { storekeeper: false, cashier: false, waiter: false, supervisor: true, manager: true, admin: true }, delete: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: false, admin: true } },
  suppliers: { view: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true }, edit: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: true, admin: true }, delete: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: false, admin: true } },
  expenses: { view: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true }, edit: { storekeeper: false, cashier: false, waiter: false, supervisor: true, manager: true, admin: true }, delete: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: false, admin: true } },
  stockMovements: { view: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true }, edit: { storekeeper: false, cashier: false, waiter: false, supervisor: true, manager: true, admin: true }, delete: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: false, admin: true } },
  purchases: { view: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true }, edit: { storekeeper: false, cashier: false, waiter: false, supervisor: true, manager: true, admin: true }, delete: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: false, admin: true } },
  employees: { view: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true }, edit: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: true, admin: true }, delete: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: false, admin: true } },
};

const settingSchema = new mongoose.Schema(
  {
    hotelName: { type: String, default: 'Mr Sandwich' },
    systemEmail: { type: String, default: 'info@mrsandwich.com' },
    phone: { type: String, default: '+251 911 000 111' },
    address: { type: String, default: 'Addis Ababa, Ethiopia' },
    currency: { type: String, default: 'ETB' },
    currencySymbol: { type: String, default: 'ETB' },
    lowStockThresholdDefault: { type: Number, default: 15 },
    taxRate: { type: Number, default: 15 },
    // ── Service Charge & Hospitality Fees ────────────────────────
    enableServiceCharge: { type: Boolean, default: false },
    serviceChargeRate: { type: Number, default: 10, min: 0, max: 100 },
    serviceChargePresets: { type: [Number], default: [5, 10, 15] },
    autoApplyServiceChargeDineIn: { type: Boolean, default: false },
    autoGenerateVoucherNo: { type: Boolean, default: true },
    allowNegativeStock: { type: Boolean, default: false },
    rolePermissions: {
      type: Object,
      default: {
        recordGoods: { storekeeper: true, cashier: false, waiter: false, supervisor: true, manager: true, admin: true },
        checkReview: { storekeeper: false, cashier: false, waiter: false, supervisor: true, manager: true, admin: true },
        approveGoods: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: false, admin: true },
        postLedger: { storekeeper: false, cashier: false, waiter: false, supervisor: true, manager: true, admin: true },
        voidTransactions: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: false, admin: true },
        viewReports: { storekeeper: false, cashier: false, waiter: false, supervisor: true, manager: true, admin: true },
        manageAccounts: { storekeeper: false, cashier: false, waiter: false, supervisor: false, manager: false, admin: true },
      },
    },
    navVisibility: {
      type: Object,
      default: DEFAULT_NAV_VISIBILITY,
    },
    crudPermissions: {
      type: Object,
      default: DEFAULT_CRUD_PERMISSIONS,
    },
    // Developer & System Owner Master Licensing Controls
    licensedModules: {
      type: Object,
      default: {
        subsystem: true, // Subsystem: POS Ordering, Captain Order, Cash Sales
        digitalMenu: true, // Digital Menu Suite: Customer QR Menu & Table Self-Ordering
        finance: true, // Finance & Expenses Suite: Overhead Expenses, Analytics & P&L
        themeCustomization: true, // Allow Hotel Admin to customize Sidebar Appearance & Brand Theme
        materialIcons: true, // Material UI Icons with colorful badges (true) vs Classic minimal icons (false)
        sidebarTheme: 'navy', // 'navy' | 'slate' | 'espresso' | 'emerald' | 'violet' | 'black' | etc.
      },
    },
    sidebarTheme: {
      type: String,
      default: 'navy',
    },
    sidebarMaterialIcons: {
      type: Boolean,
      default: true,
    },
    devMasterKey: {
      type: String,
      default: 'dev-owner-2026',
    },
    // Telegram bot subscribers — array of { chatId, name, username, subscribedAt }
    telegramSubscribers: {
      type: Array,
      default: [],
    },
    // ── Telegram Daily Sales Digest Scheduler ─────────────────────
    telegramDailyReportEnabled: { type: Boolean, default: true },
    telegramDailyReportTime: { type: String, default: '12:00' },
    lastDailyReportExecution: { type: String, default: '' },
    lastDailyReportDate: { type: String, default: '' },
    notes: { type: String, default: 'Mr Sandwich Restaurant & Stock Control System' },

    // ── Pricing & Cost Parameters ─────────────────────────────────
    // Contingency: % buffer added on top of raw material cost (waste, price fluctuation)
    contingencyPercent: { type: Number, default: 10, min: 0, max: 100 },
    // Overhead: % of total cost added for electricity, labour, etc.
    overheadPercent: { type: Number, default: 25, min: 0, max: 100 },
    // Spice Cost: % added for spices, seasoning, culinary oils (Ethiopian hotel/cafe standard)
    spiceCostPercent: { type: Number, default: 5, min: 0, max: 100 },
    // Default Food Cost %: used to back-calculate suggested selling price
    // e.g. if food cost % = 30, selling price = totalCost / 0.30
    defaultFoodCostPercent: { type: Number, default: 30, min: 1, max: 100 },
    // Raw Material Price Adjustment: apply globally before recipe cost calculation
    // 'percent' = add X% to every unit cost | 'fixed' = add fixed ETB amount
    rawMaterialPriceAdjustType: { type: String, default: 'percent', enum: ['percent', 'fixed'] },
    rawMaterialPriceAdjustValue: { type: Number, default: 0, min: 0 },
    // Product Selling Price Bulk Adjustment — percentage to add to ALL product selling prices
    productSellingPriceAdjustPercent: { type: Number, default: 0, min: 0, max: 500 },

    // ── Digital Menu & QR Ordering Settings ──────────────────────
    digitalMenuSettings: {
      type: Object,
      default: {
        enabled: true,
        allowOrdering: true,
        enableCallWaiter: true,
        enableBillRequest: true,
        bannerText: 'Delicious Food Freshly Made',
        bannerSubtitle: 'Signature Sandwiches, Burgers & Specialty Drinks',
        phone: '+251 91 123 4567',
        landline: '+251 11 667 8900',
        googleMapsLink: 'https://maps.google.com/?q=Mr+Sandwich+Addis+Ababa',
        googleMapsEmbedUrl: 'https://maps.google.com/maps?q=Addis%20Ababa,%20Ethiopia&output=embed',
        tiktokUrl: '',
        facebookUrl: '',
        instagramUrl: '',
        telegramUrl: 'https://t.me/mrsandwichethiopia',
        tables: [
          'Table 01', 'Table 02', 'Table 03', 'Table 04', 'Table 05',
          'Table 06', 'Table 07', 'Table 08', 'Table 09', 'Table 10',
          'Table 12', 'Table 15', 'VIP 01', 'Patio 01',
        ],
        aboutTitle: 'Mr Sandwich',
        aboutSubtitle: 'Addis Ababa, Ethiopia',
        aboutDescription: 'Famous for gourmet sandwiches, burgers, artisan snacks, craft beverages, and warm welcoming hospitality.',
        aboutDescriptionAmharic: 'በልዩ ጥራትና ፍቅር የሚዘጋጁ ምርጥ ሳንድዊቾች፣ በርገሮች እና መጠጦች ከሞቅ ያለ እንግዳ ተቀባይነት ጋር።',
        aboutBadge1Icon: '🥪',
        aboutBadge1Label: 'Gourmet Sandwiches',
        aboutBadge2Icon: '🍔',
        aboutBadge2Label: 'Fresh Burgers',
        aboutBadge3Icon: '☕',
        aboutBadge3Label: 'Specialty Drinks',
        galleryTitle: 'Our Chefs & Atmosphere',
        galleryTitleAmharic: 'የሬስቶራንቱ ድባብ እና የእጅ ሙያ',
        gallerySubtitle: 'Photo Gallery',
        galleryItems: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80',
            caption: '🥪 Fresh Gourmet Sandwiches',
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
            caption: '🍔 Juicy Crafted Burgers',
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
            caption: '☕ Barista Specialty Drinks',
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
            caption: '✨ Cozy Dining Ambiance',
          },
        ],
      },
    },
    menuReviews: [
      {
        customerName: { type: String, default: 'Valued Guest' },
        tableNo:      { type: String, default: '' },
        rating:       { type: Number, default: 5 },
        comment:      { type: String, default: '' },
        approved:     { type: Boolean, default: true },
        createdAt:    { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
module.exports.DEFAULT_NAV_VISIBILITY = DEFAULT_NAV_VISIBILITY;
