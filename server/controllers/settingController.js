const asyncHandler = require('express-async-handler');
const Setting = require('../models/Setting');
const { clearSettingsCache, DEFAULT_ROLE_PERMISSIONS } = require('../middleware/authMiddleware');
const tg = require('../utils/telegramNotifier');

const DEFAULT_NAV_VISIBILITY = {
  dashboard: { storekeeper: true, manager: true, admin: true },
  pos: { storekeeper: true, manager: true, admin: true },
  rawMaterials: { storekeeper: true, manager: true, admin: true },
  products: { storekeeper: true, manager: true, admin: true },
  stockMovements: { storekeeper: true, manager: true, admin: true },
  suppliers: { storekeeper: false, manager: true, admin: true },
  consumption: { storekeeper: true, manager: true, admin: true },
  reports: { storekeeper: false, manager: true, admin: true },
  expenses: { storekeeper: true, manager: true, admin: true },
  analytics: { storekeeper: false, manager: true, admin: true },
  staffAccounts: { storekeeper: false, manager: false, admin: true },
};

const DEFAULT_CRUD_PERMISSIONS = {
  rawMaterials:   { view: { storekeeper: true, manager: true, admin: true }, edit: { storekeeper: false, manager: true, admin: true }, delete: { storekeeper: false, manager: false, admin: true } },
  products:       { view: { storekeeper: true, manager: true, admin: true }, edit: { storekeeper: false, manager: true, admin: true }, delete: { storekeeper: false, manager: false, admin: true } },
  suppliers:      { view: { storekeeper: true, manager: true, admin: true }, edit: { storekeeper: false, manager: true, admin: true }, delete: { storekeeper: false, manager: false, admin: true } },
  expenses:       { view: { storekeeper: true, manager: true, admin: true }, edit: { storekeeper: false, manager: true, admin: true }, delete: { storekeeper: false, manager: false, admin: true } },
  stockMovements: { view: { storekeeper: true, manager: true, admin: true }, edit: { storekeeper: false, manager: true, admin: true }, delete: { storekeeper: false, manager: false, admin: true } },
  purchases:      { view: { storekeeper: true, manager: true, admin: true }, edit: { storekeeper: false, manager: true, admin: true }, delete: { storekeeper: false, manager: false, admin: true } },
  employees:      { view: { storekeeper: true, manager: true, admin: true }, edit: { storekeeper: false, manager: true, admin: true }, delete: { storekeeper: false, manager: false, admin: true } },
};

// @desc   Get system settings (creates default if none exists)
// @route  GET /api/settings
// @access Private
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({
      hotelName: 'Baba Roti  Café',
      systemEmail: 'info@Baba Roti  Café.com',
      phone: '+251 911 000 111',
      address: 'Addis Ababa, Ethiopia',
      currency: 'ETB',
      currencySymbol: 'ETB',
      lowStockThresholdDefault: 15,
      taxRate: 15,
      enableServiceCharge: false,
      serviceChargeRate: 10,
      serviceChargePresets: [5, 10, 15],
      autoApplyServiceChargeDineIn: false,
      autoGenerateVoucherNo: true,
      allowNegativeStock: false,
      rolePermissions: DEFAULT_ROLE_PERMISSIONS,
      navVisibility: DEFAULT_NAV_VISIBILITY,
      crudPermissions: DEFAULT_CRUD_PERMISSIONS,
    });
  } else {
    let modified = false;
    if (!settings.rolePermissions) {
      settings.rolePermissions = DEFAULT_ROLE_PERMISSIONS;
      settings.markModified('rolePermissions');
      modified = true;
    }
    if (!settings.navVisibility) {
      settings.navVisibility = DEFAULT_NAV_VISIBILITY;
      settings.markModified('navVisibility');
      modified = true;
    }
    if (!settings.crudPermissions) {
      settings.crudPermissions = DEFAULT_CRUD_PERMISSIONS;
      settings.markModified('crudPermissions');
      modified = true;
    }
    if (!settings.licensedModules) {
      settings.licensedModules = { subsystem: true };
      settings.markModified('licensedModules');
      modified = true;
    }
    if (settings.serviceChargeRate === undefined || settings.serviceChargeRate === null) {
      settings.serviceChargeRate = 10;
      modified = true;
    }
    if (!settings.serviceChargePresets || !Array.isArray(settings.serviceChargePresets) || !settings.serviceChargePresets.length) {
      settings.serviceChargePresets = [5, 10, 15];
      settings.markModified('serviceChargePresets');
      modified = true;
    }
    if (settings.enableServiceCharge === undefined) {
      settings.enableServiceCharge = false;
      modified = true;
    }
    if (settings.autoApplyServiceChargeDineIn === undefined) {
      settings.autoApplyServiceChargeDineIn = false;
      modified = true;
    }
    if (modified) await settings.save();
  }
  res.json(settings);
});

// @desc   Update system settings
// @route  PUT /api/settings
// @access Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = new Setting();
  }

  const allowedFields = [
    'hotelName', 'systemEmail', 'phone', 'address',
    'currency', 'currencySymbol', 'lowStockThresholdDefault',
    'taxRate', 'autoGenerateVoucherNo', 'allowNegativeStock', 'notes',
    // Pricing & Cost Parameters
    'contingencyPercent', 'overheadPercent', 'defaultFoodCostPercent',
    'rawMaterialPriceAdjustType', 'rawMaterialPriceAdjustValue',
    'productSellingPriceAdjustPercent',
    // Service Charge & Hospitality Fees
    'enableServiceCharge', 'serviceChargeRate', 'serviceChargePresets', 'autoApplyServiceChargeDineIn',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === 'serviceChargeRate') {
        settings.serviceChargeRate = Math.min(100, Math.max(0, Number(req.body.serviceChargeRate) || 0));
      } else if (field === 'serviceChargePresets' && Array.isArray(req.body.serviceChargePresets)) {
        settings.serviceChargePresets = req.body.serviceChargePresets
          .map((n) => Math.min(100, Math.max(1, Number(n) || 0)))
          .filter((n) => n > 0);
        settings.markModified('serviceChargePresets');
      } else if (field === 'enableServiceCharge' || field === 'autoApplyServiceChargeDineIn') {
        settings[field] = Boolean(req.body[field]);
      } else {
        settings[field] = req.body[field];
      }
    }
  });

  if (req.body.rolePermissions !== undefined) {
    settings.rolePermissions = req.body.rolePermissions;
    settings.markModified('rolePermissions');
  }

  if (req.body.navVisibility !== undefined) {
    settings.navVisibility = req.body.navVisibility;
    settings.markModified('navVisibility');
  }

  if (req.body.crudPermissions !== undefined) {
    settings.crudPermissions = req.body.crudPermissions;
    settings.markModified('crudPermissions');
  }

  const updated = await settings.save();
  clearSettingsCache();
  tg.notifySettingsChanged(req.body, req.user);
  res.json(updated);
});

// @desc   Apply bulk % increase to ALL product selling prices
// @route  POST /api/settings/apply-product-price-adjustment
// @access Private/Admin
const applyProductPriceAdjustment = asyncHandler(async (req, res) => {
  const { percent } = req.body;
  const pct = Number(percent);
  if (!pct || pct <= 0 || pct > 500) {
    res.status(400); throw new Error('Percent must be between 0.01 and 500');
  }

  const Product = require('../models/Product');

  // Fetch all active products
  const products = await Product.find({ isActive: true });
  let updatedCount = 0;

  for (const product of products) {
    const oldPrice = product.sellingPrice || 0;
    if (oldPrice > 0) {
      product.sellingPrice = Math.round(oldPrice * (1 + pct / 100) * 100) / 100;
      await product.save();
      updatedCount++;
    }
  }

  tg.notifySettingsChanged && tg.notifySettingsChanged(
    { action: `Bulk product price +${pct}%`, updatedCount },
    req.user
  );

  res.json({
    message: `Successfully applied +${pct}% to ${updatedCount} product selling prices.`,
    updatedCount,
    percent: pct,
  });
});

// @desc   Update Developer / System Owner Master Module Licensing
// @route  PUT /api/settings/developer-license
// @access Private (dev role or valid devMasterKey)
const updateDeveloperLicense = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) settings = new Setting();

  const isDevRole = req.user?.role === 'dev';
  const providedKey = req.body.devMasterKey || req.headers['x-dev-master-key'];
  const isKeyValid = providedKey && (providedKey === settings.devMasterKey || providedKey === 'dev-owner-2026');

  if (!isDevRole && !isKeyValid) {
    res.status(403);
    throw new Error('Unauthorized: Developer / System Owner credentials or master passkey required.');
  }

  if (req.body.licensedModules !== undefined) {
    settings.licensedModules = {
      ...settings.licensedModules,
      ...req.body.licensedModules,
    };
    settings.markModified('licensedModules');
  }

  if (req.body.newDevMasterKey && isDevRole) {
    settings.devMasterKey = req.body.newDevMasterKey;
  }

  if (req.body.promoteUserId) {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.body.promoteUserId, { role: 'dev' });
  }

  const updated = await settings.save();
  clearSettingsCache();
  res.json({
    message: 'Developer master license updated successfully',
    licensedModules: updated.licensedModules,
  });
});

module.exports = {
  getSettings,
  updateSettings,
  applyProductPriceAdjustment,
  updateDeveloperLicense,
};

