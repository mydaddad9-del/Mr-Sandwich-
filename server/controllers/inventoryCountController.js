const asyncHandler = require('express-async-handler');
const InventoryCount = require('../models/InventoryCount');
const RawMaterial = require('../models/RawMaterial');
const StockTransaction = require('../models/StockTransaction');
const tg = require('../utils/telegramNotifier');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Helper: compute WAC from non-voided receiving transactions or fallback to unitCost ──
async function computeWAC(materialId, upToDate, fallbackUnitCost = 0) {
  try {
    const txns = await StockTransaction.find({
      $or: [{ material: materialId }, { 'items.material': materialId }],
      status: { $ne: 'voided' },
      date: { $lte: upToDate },
      $or: [
        { voucherType: { $in: ['cash_grv', 'credit_grv', 'fresh_bazaar', 'pos_adjustment'] } },
        { type: 'in' },
      ],
    }).sort({ date: 1 });

    let totalQty = 0;
    let totalCost = 0;

    for (const tx of txns) {
      if (tx.items && tx.items.length > 0) {
        const line = tx.items.find((i) => String(i.material) === String(materialId));
        if (line && Number(line.quantity) > 0) {
          const qty = Number(line.quantity);
          const cost = Number(line.unitCost || 0) || Number(fallbackUnitCost || 0);
          totalQty += qty;
          totalCost += cost * qty;
        }
      } else if (String(tx.material) === String(materialId) && Number(tx.quantity) > 0) {
        const qty = Number(tx.quantity);
        const cost = Number(tx.unitCost || 0) || Number(fallbackUnitCost || 0);
        totalQty += qty;
        totalCost += cost * qty;
      }
    }

    if (totalQty > 0 && totalCost > 0) {
      return Number((totalCost / totalQty).toFixed(2));
    }
  } catch (err) {
    console.warn('Error computing WAC:', err.message);
  }

  return Number(fallbackUnitCost || 0);
}

// ── Helper: compute period movement (in/out) ───────────────────────────────
async function getPeriodMovement(materialId, periodStart, periodEnd) {
  const txns = await StockTransaction.find({
    $or: [{ material: materialId }, { 'items.material': materialId }],
    status: { $ne: 'voided' },
    date: { $gte: periodStart, $lte: periodEnd },
  });

  let inQty = 0;
  let outQty = 0;

  for (const tx of txns) {
    const vt = tx.voucherType || (tx.type === 'in' ? 'pos_adjustment' : 'neg_adjustment');
    const isOut = ['disposal', 'neg_adjustment', 'sales_import', 'pos_sale', 'manual_sale'].includes(vt) || tx.type === 'out';

    let qty = 0;
    if (tx.items && tx.items.length > 0) {
      const line = tx.items.find((i) => String(i.material) === String(materialId));
      if (line) qty = Number(line.quantity || 0);
    } else if (String(tx.material) === String(materialId)) {
      qty = Number(tx.quantity || 0);
    }

    if (isOut) {
      outQty += qty;
    } else {
      inQty += qty;
    }
  }

  return {
    inQty: Number(inQty.toFixed(4)),
    outQty: Number(outQty.toFixed(4)),
  };
}

// ── Helper: compute accurate balances for a material ────────────────────────
async function getMaterialBalances(material, periodStart, periodEnd) {
  const now = new Date();
  const currentStock = Number(material.currentStock || 0);

  // 1. Transactions inside this count month
  const { inQty, outQty } = await getPeriodMovement(material._id, periodStart, periodEnd);

  // 2. Transactions after this period (if reconciling a past month)
  let postPeriodNetChange = 0;
  if (periodEnd < now) {
    const postTxns = await StockTransaction.find({
      $or: [{ material: material._id }, { 'items.material': material._id }],
      status: { $ne: 'voided' },
      date: { $gt: periodEnd },
    });

    for (const tx of postTxns) {
      const vt = tx.voucherType || (tx.type === 'in' ? 'pos_adjustment' : 'neg_adjustment');
      const isOut = ['disposal', 'neg_adjustment', 'sales_import', 'pos_sale', 'manual_sale'].includes(vt) || tx.type === 'out';

      let qty = 0;
      if (tx.items && tx.items.length > 0) {
        const line = tx.items.find((i) => String(i.material) === String(material._id));
        if (line) qty = Number(line.quantity || 0);
      } else if (String(tx.material) === String(material._id)) {
        qty = Number(tx.quantity || 0);
      }

      if (isOut) {
        postPeriodNetChange += qty; // add back goods that left after the period
      } else {
        postPeriodNetChange -= qty; // subtract goods that arrived after the period
      }
    }
  }

  // System closing balance at end of period
  let closingStock = (periodEnd < now)
    ? Math.max(0, Number((currentStock + postPeriodNetChange).toFixed(4)))
    : Math.max(0, Number(currentStock.toFixed(4)));

  // Opening balance at start of period: Opening = Closing - IN + OUT
  let beginBalance = Math.max(0, Number((closingStock - inQty + outQty).toFixed(4)));

  // If there have been no period movements and closing calculated as 0, but current stock exists
  if (inQty === 0 && outQty === 0 && closingStock === 0 && currentStock > 0) {
    closingStock = currentStock;
    beginBalance = currentStock;
  }

  // System balance is the expected stock according to system records
  const systemBalance = Number((beginBalance + inQty - outQty).toFixed(4));

  return {
    beginBalance: Math.max(0, beginBalance),
    inQty,
    outQty,
    systemBalance: Math.max(0, systemBalance),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// GET  /api/inventory-count/stores
// Returns distinct store locations from RawMaterial
// ════════════════════════════════════════════════════════════════════════════
exports.getStores = asyncHandler(async (req, res) => {
  const stores = await RawMaterial.distinct('storeLocation', { isActive: true });
  res.json({ stores: stores.filter(Boolean) });
});

// ════════════════════════════════════════════════════════════════════════════
// GET  /api/inventory-count?year=&month=&store=&status=
// List inventory count sessions (filter optional)
// ════════════════════════════════════════════════════════════════════════════
exports.listCounts = asyncHandler(async (req, res) => {
  const { year, month, store, status } = req.query;
  const filter = {};
  if (year)   filter.periodYear  = Number(year);
  if (month)  filter.periodMonth = Number(month);
  if (store)  filter.storeLocation = store;
  if (status) filter.status = status;

  const counts = await InventoryCount.find(filter)
    .sort({ periodYear: -1, periodMonth: -1, storeLocation: 1 })
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name')
    .lean();

  res.json({ counts });
});

// ════════════════════════════════════════════════════════════════════════════
// GET  /api/inventory-count/:id
// Get a single inventory count with full lines. Auto-synchronizes live stock
// if the count is still in draft/submitted status.
// ════════════════════════════════════════════════════════════════════════════
exports.getCount = asyncHandler(async (req, res) => {
  const doc = await InventoryCount.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name');

  if (!doc) return res.status(404).json({ message: 'Count not found' });

  // Auto-sync balances if not approved/closed
  if (doc.status !== 'approved' && doc.status !== 'closed') {
    await syncCountDoc(doc);
  }

  res.json({ count: doc });
});

// Helper to synchronize lines with live system stock and movements
async function syncCountDoc(doc) {
  const periodStart = new Date(doc.periodYear, doc.periodMonth - 1, 1);
  const periodEnd   = new Date(doc.periodYear, doc.periodMonth, 0, 23, 59, 59, 999);

  const materials = await RawMaterial.find({
    storeLocation: doc.storeLocation,
    isActive: true,
  }).lean();

  const materialMap = {};
  materials.forEach((m) => {
    materialMap[m._id.toString()] = m;
  });

  let modified = false;

  for (const line of doc.lines) {
    const mat = materialMap[String(line.material)];
    if (!mat) continue;

    const bal = await getMaterialBalances(mat, periodStart, periodEnd);
    const wac = await computeWAC(mat._id, periodEnd, mat.unitCost);

    // Update if values differ or if line was previously initialized with 0
    if (
      line.systemBalance !== bal.systemBalance ||
      line.beginBalance !== bal.beginBalance ||
      line.inQty !== bal.inQty ||
      line.outQty !== bal.outQty ||
      line.wac !== wac
    ) {
      line.beginBalance  = bal.beginBalance;
      line.inQty         = bal.inQty;
      line.outQty        = bal.outQty;
      line.systemBalance = bal.systemBalance;
      line.wac           = wac;

      if (line.isCounted && line.physicalCount !== null) {
        line.variance      = Number((line.physicalCount - line.systemBalance).toFixed(4));
        line.varianceValue = Number((line.variance * (line.wac || 0)).toFixed(2));
        if (line.variance > 0) line.varianceType = 'positive';
        else if (line.variance < 0) line.varianceType = 'negative';
        else line.varianceType = 'zero';
      }
      modified = true;
    }
  }

  // Also append any newly created materials in this store that aren't on the count sheet yet
  const existingMatIds = new Set(doc.lines.map((l) => String(l.material)));
  for (const mat of materials) {
    if (!existingMatIds.has(String(mat._id))) {
      const bal = await getMaterialBalances(mat, periodStart, periodEnd);
      const wac = await computeWAC(mat._id, periodEnd, mat.unitCost);

      doc.lines.push({
        material:      mat._id,
        materialName:  mat.name,
        unit:          mat.unit,
        beginBalance:  bal.beginBalance,
        inQty:         bal.inQty,
        outQty:        bal.outQty,
        systemBalance: bal.systemBalance,
        physicalCount: null,
        variance:      0,
        varianceType:  null,
        wac,
        varianceValue: 0,
        isCounted:     false,
        note:          '',
      });
      modified = true;
    }
  }

  if (modified) {
    doc.totalItems = doc.lines.length;
    doc.positiveVariance = doc.lines
      .filter((l) => l.varianceType === 'positive')
      .reduce((s, l) => s + l.varianceValue, 0);
    doc.negativeVariance = doc.lines
      .filter((l) => l.varianceType === 'negative')
      .reduce((s, l) => s + l.varianceValue, 0);
    doc.netVarianceValue = doc.positiveVariance + doc.negativeVariance;
    await doc.save();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST /api/inventory-count/:id/sync
// Explicitly re-sync count sheet with current database stock & transactions
// ════════════════════════════════════════════════════════════════════════════
exports.syncCount = asyncHandler(async (req, res) => {
  const doc = await InventoryCount.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Count not found' });
  if (doc.status === 'approved' || doc.status === 'closed') {
    return res.status(400).json({ message: 'Cannot re-sync an approved count' });
  }

  await syncCountDoc(doc);
  res.json({ count: doc, message: 'Stock balances synced successfully' });
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/inventory-count/initialize
// Creates a new count sheet for store+month+year, pre-filled with all
// materials in that store and their live begin balance + period movement.
// ════════════════════════════════════════════════════════════════════════════
exports.initializeCount = asyncHandler(async (req, res) => {
  const { periodYear, periodMonth, storeLocation, notes } = req.body;

  if (!periodYear || !periodMonth || !storeLocation) {
    return res.status(400).json({ message: 'periodYear, periodMonth and storeLocation are required' });
  }

  // Check duplicate
  const exists = await InventoryCount.findOne({ periodYear, periodMonth, storeLocation });
  if (exists) {
    return res.status(409).json({
      message: `Count for ${storeLocation} – ${MONTHS[periodMonth - 1]} ${periodYear} already exists`,
      existingId: exists._id,
    });
  }

  const periodStart = new Date(periodYear, periodMonth - 1, 1);
  const periodEnd   = new Date(periodYear, periodMonth, 0, 23, 59, 59, 999);

  const materials = await RawMaterial.find({ storeLocation, isActive: true }).lean();

  const lines = await Promise.all(
    materials.map(async (mat) => {
      const bal = await getMaterialBalances(mat, periodStart, periodEnd);
      const wac = await computeWAC(mat._id, periodEnd, mat.unitCost);

      return {
        material:      mat._id,
        materialName:  mat.name,
        unit:          mat.unit,
        beginBalance:  bal.beginBalance,
        inQty:         bal.inQty,
        outQty:        bal.outQty,
        systemBalance: bal.systemBalance,
        physicalCount: null,
        variance:      0,
        varianceType:  null,
        wac,
        varianceValue: 0,
        isCounted:     false,
        note:          '',
      };
    })
  );

  const title = `${MONTHS[periodMonth - 1]} ${periodYear} – ${storeLocation}`;

  const doc = await InventoryCount.create({
    periodYear,
    periodMonth,
    storeLocation,
    title,
    lines,
    totalItems: lines.length,
    notes: notes || '',
    createdBy: req.user._id,
  });

  res.status(201).json({ count: doc });
});

// ════════════════════════════════════════════════════════════════════════════
// PATCH /api/inventory-count/:id/lines
// Update physical counts for one or more lines (save progress)
// Body: { lines: [{ material, physicalCount, note }] }
// ════════════════════════════════════════════════════════════════════════════
exports.updateLines = asyncHandler(async (req, res) => {
  const doc = await InventoryCount.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Count not found' });
  if (doc.status === 'approved' || doc.status === 'closed') {
    return res.status(400).json({ message: 'Cannot edit an approved or closed count' });
  }

  const updates = req.body.lines || [];

  for (const upd of updates) {
    const line = doc.lines.find((l) => String(l.material) === String(upd.material));
    if (!line) continue;

    if (upd.physicalCount !== undefined && upd.physicalCount !== null && upd.physicalCount !== '') {
      line.physicalCount = Number(upd.physicalCount);
      line.isCounted     = true;
      line.variance      = Number((line.physicalCount - line.systemBalance).toFixed(4));
      line.varianceValue = Number((line.variance * (line.wac || 0)).toFixed(2));
      if (line.variance > 0) line.varianceType = 'positive';
      else if (line.variance < 0) line.varianceType = 'negative';
      else line.varianceType = 'zero';
    }
    if (upd.note !== undefined) line.note = upd.note;
  }

  // Recompute summary totals
  doc.countedItems   = doc.lines.filter((l) => l.isCounted).length;
  doc.uncountedItems = doc.lines.length - doc.countedItems;
  doc.totalItems     = doc.lines.length;
  doc.positiveVariance = doc.lines
    .filter((l) => l.varianceType === 'positive')
    .reduce((s, l) => s + l.varianceValue, 0);
  doc.negativeVariance = doc.lines
    .filter((l) => l.varianceType === 'negative')
    .reduce((s, l) => s + l.varianceValue, 0);
  doc.netVarianceValue = doc.positiveVariance + doc.negativeVariance;

  await doc.save();
  res.json({ count: doc });
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/inventory-count/:id/submit
// Submit for approval
// ════════════════════════════════════════════════════════════════════════════
exports.submitCount = asyncHandler(async (req, res) => {
  const doc = await InventoryCount.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Count not found' });
  if (doc.status !== 'draft') {
    return res.status(400).json({ message: `Cannot submit a count in "${doc.status}" status` });
  }

  doc.status      = 'submitted';
  doc.submittedBy = req.user._id;
  doc.submittedAt = new Date();
  await doc.save();

  tg.notifyInventoryCountSubmitted(doc, req.user);
  res.json({ count: doc, message: 'Count submitted for approval' });
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/inventory-count/:id/approve
// Approve and lock the count; set closing date
// ════════════════════════════════════════════════════════════════════════════
exports.approveCount = asyncHandler(async (req, res) => {
  const doc = await InventoryCount.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Count not found' });
  if (doc.status !== 'submitted') {
    return res.status(400).json({ message: `Cannot approve a count in "${doc.status}" status` });
  }

  doc.status      = 'approved';
  doc.approvedBy  = req.user._id;
  doc.approvedAt  = new Date();
  doc.closingDate = new Date();

  // Lock all lines: systemBalance becomes the physical count if not counted
  for (const line of doc.lines) {
    if (!line.isCounted) {
      line.physicalCount = line.systemBalance;
      line.variance      = 0;
      line.varianceType  = 'zero';
      line.varianceValue = 0;
    }
  }

  await doc.save();
  tg.notifyInventoryCountApproved(doc, req.user);
  res.json({ count: doc, message: 'Count approved and closing balance set' });
});

// ════════════════════════════════════════════════════════════════════════════
// DELETE /api/inventory-count/:id
// Delete a draft count
// ════════════════════════════════════════════════════════════════════════════
exports.deleteCount = asyncHandler(async (req, res) => {
  const doc = await InventoryCount.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Count not found' });
  if (doc.status !== 'draft') {
    return res.status(400).json({ message: 'Only draft counts can be deleted' });
  }
  await doc.deleteOne();
  res.json({ message: 'Count deleted' });
});
