const asyncHandler = require('express-async-handler');
const PrinterSettings = require('../models/PrinterSettings');
const { testPrinter, printKOT, printReceipt } = require('../utils/printService');

// ── GET all printers ─────────────────────────────────────────────────────────
const getPrinters = asyncHandler(async (req, res) => {
  const printers = await PrinterSettings.find().sort({ createdAt: 1 });
  res.json(printers);
});

// ── GET single printer ───────────────────────────────────────────────────────
const getPrinter = asyncHandler(async (req, res) => {
  const printer = await PrinterSettings.findById(req.params.id);
  if (!printer) return res.status(404).json({ message: 'Printer not found' });
  res.json(printer);
});

// ── CREATE printer ───────────────────────────────────────────────────────────
const createPrinter = asyncHandler(async (req, res) => {
  const printer = await PrinterSettings.create(req.body);
  res.status(201).json(printer);
});

// ── UPDATE printer ───────────────────────────────────────────────────────────
const updatePrinter = asyncHandler(async (req, res) => {
  const printer = await PrinterSettings.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!printer) return res.status(404).json({ message: 'Printer not found' });
  res.json(printer);
});

// ── DELETE printer ───────────────────────────────────────────────────────────
const deletePrinter = asyncHandler(async (req, res) => {
  const printer = await PrinterSettings.findByIdAndDelete(req.params.id);
  if (!printer) return res.status(404).json({ message: 'Printer not found' });
  res.json({ message: 'Printer deleted' });
});

// ── TEST printer connectivity ────────────────────────────────────────────────
const pingPrinter = asyncHandler(async (req, res) => {
  const { ip, port } = req.body;
  if (!ip) return res.status(400).json({ ok: false, error: 'IP address is required' });

  const result = await testPrinter(ip, port || 9100);
  res.json(result);
});

// ── PRINT a KOT (kitchen order ticket) ──────────────────────────────────────
const printKOTEndpoint = asyncHandler(async (req, res) => {
  const { order, printerId, opts } = req.body;
  if (!order) return res.status(400).json({ message: 'Order data required' });

  // Find enabled kitchen/both printers
  let query = { enabled: true, type: { $in: ['kitchen', 'both'] } };
  if (printerId) query = { _id: printerId };

  const printers = await PrinterSettings.find(query);
  if (!printers.length) {
    return res.status(404).json({ message: 'No kitchen printer configured or enabled' });
  }

  const results = [];
  for (const printer of printers) {
    try {
      await printKOT(printer, order, opts || {});
      results.push({ printer: printer.name, ok: true });
    } catch (err) {
      results.push({ printer: printer.name, ok: false, error: err.message });
    }
  }

  const allOk = results.every((r) => r.ok);
  res.status(allOk ? 200 : 207).json({ results });
});

// ── PRINT a receipt ──────────────────────────────────────────────────────────
const printReceiptEndpoint = asyncHandler(async (req, res) => {
  const { order, printerId, opts } = req.body;
  if (!order) return res.status(400).json({ message: 'Order data required' });

  let query = { enabled: true, type: { $in: ['receipt', 'both'] } };
  if (printerId) query = { _id: printerId };

  const printers = await PrinterSettings.find(query);
  if (!printers.length) {
    return res.status(404).json({ message: 'No receipt printer configured or enabled' });
  }

  const results = [];
  for (const printer of printers) {
    try {
      await printReceipt(printer, order, opts || {});
      results.push({ printer: printer.name, ok: true });
    } catch (err) {
      results.push({ printer: printer.name, ok: false, error: err.message });
    }
  }

  const allOk = results.every((r) => r.ok);
  res.status(allOk ? 200 : 207).json({ results });
});

module.exports = {
  getPrinters,
  getPrinter,
  createPrinter,
  updatePrinter,
  deletePrinter,
  pingPrinter,
  printKOTEndpoint,
  printReceiptEndpoint,
};
