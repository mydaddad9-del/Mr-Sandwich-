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

// ── In-Memory Cloud Print Relay Engine ──────────────────────────────────────
const pendingRelayJobs = new Map(); // jobId -> { resolve, timer }
let relayJobQueue = [];
let lastRelayAgentHeartbeat = 0;
let relayAgentWaiters = [];

function hasActiveRelayAgent() {
  return (Date.now() - lastRelayAgentHeartbeat) < 90000;
}

function dispatchToRelay(action, payload, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const jobId = 'relay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const job = { id: jobId, action, payload, createdAt: Date.now() };

    const timer = setTimeout(() => {
      pendingRelayJobs.delete(jobId);
      relayJobQueue = relayJobQueue.filter((j) => j.id !== jobId);
      resolve({ ok: false, error: 'Local POS print agent timed out' });
    }, timeoutMs);

    pendingRelayJobs.set(jobId, { resolve, timer });

    if (relayAgentWaiters.length > 0) {
      const waitingRes = relayAgentWaiters.shift();
      try {
        waitingRes.json({ jobs: [job] });
      } catch (_) {}
    } else {
      relayJobQueue.push(job);
    }
  });
}

// ── TEST printer connectivity ────────────────────────────────────────────────
const pingPrinter = asyncHandler(async (req, res) => {
  const { ip, port } = req.body;
  if (!ip) return res.status(400).json({ ok: false, error: 'IP address is required' });

  // 1. Try direct socket connection (works when running locally on LAN)
  const result = await testPrinter(ip, port || 9100);
  if (result.ok) {
    return res.json(result);
  }

  // 2. If direct fails (cloud server cannot reach private LAN IP), dispatch to relay agent!
  if (hasActiveRelayAgent()) {
    const relayRes = await dispatchToRelay('ping', { ip, port: port || 9100 });
    return res.json(relayRes);
  }

  res.json(result);
});

// ── PRINT a KOT (kitchen order ticket) ──────────────────────────────────────
const printKOTEndpoint = asyncHandler(async (req, res) => {
  const { order, printerId, opts } = req.body;
  if (!order) return res.status(400).json({ message: 'Order data required' });

  // Find enabled kitchen/both printers
  let query = { enabled: true, type: { $in: ['kitchen', 'both'] } };
  if (printerId) query = { _id: printerId };

  let printers = await PrinterSettings.find(query);
  if (!printers.length && !printerId) {
    // Fallback to any enabled printer (e.g. single-printer restaurant setup)
    printers = await PrinterSettings.find({ enabled: true });
  }
  if (!printers.length) {
    return res.status(404).json({ message: 'No kitchen printer configured or enabled' });
  }

  const results = [];
  for (const printer of printers) {
    try {
      await printKOT(printer, order, opts || {});
      results.push({ printer: printer.name, ok: true });
    } catch (err) {
      if (hasActiveRelayAgent()) {
        const relayRes = await dispatchToRelay('kot', { printer, order, opts });
        results.push({ printer: printer.name, ok: relayRes.ok, error: relayRes.error });
      } else {
        results.push({ printer: printer.name, ok: false, error: err.message });
      }
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

  let printers = await PrinterSettings.find(query);
  if (!printers.length && !printerId) {
    // Fallback to any enabled printer (e.g. single-printer restaurant setup)
    printers = await PrinterSettings.find({ enabled: true });
  }
  if (!printers.length) {
    return res.status(404).json({ message: 'No receipt printer configured or enabled' });
  }

  const results = [];
  for (const printer of printers) {
    try {
      await printReceipt(printer, order, opts || {});
      results.push({ printer: printer.name, ok: true });
    } catch (err) {
      if (hasActiveRelayAgent()) {
        const relayRes = await dispatchToRelay('receipt', { printer, order, opts });
        results.push({ printer: printer.name, ok: relayRes.ok, error: relayRes.error });
      } else {
        results.push({ printer: printer.name, ok: false, error: err.message });
      }
    }
  }

  const allOk = results.every((r) => r.ok);
  res.status(allOk ? 200 : 207).json({ results });
});

// ── PRINT TEST PAGE ─────────────────────────────────────────────────────────
const printTestPageEndpoint = asyncHandler(async (req, res) => {
  const { printerId, ip, port, brand, model } = req.body;

  let printer;
  if (printerId) {
    printer = await PrinterSettings.findById(printerId);
    if (!printer) return res.status(404).json({ ok: false, error: 'Printer not found' });
  } else if (ip) {
    const pWidth = req.body.paperWidth || '60mm';
    const isNarrow = /58|60/i.test(pWidth);
    printer = {
      name: 'Test Printer',
      ipAddress: ip,
      port: Number(port) || 9100,
      brand: brand || 'Epson',
      model: model || 'TM-T20III',
      paperWidth: pWidth,
      charWidth: req.body.charWidth || (isNarrow ? 32 : 42),
      enabled: true,
      headerLine1: 'Bloom Bar & Restaurant',
      footerLine: 'TCP Test Print Successful!',
      copies: 1,
    };
  } else {
    return res.status(400).json({ ok: false, error: 'printerId or ip required' });
  }

  const sampleOrder = {
    orderNo: 'TCP-TEST',
    orderType: 'dine_in',
    tableNo: 'Table 1',
    waiterName: 'Server',
    customerName: 'Valued Guest',
    paymentMethod: 'Cash',
    discountPercent: 0,
    serviceCharge: 0,
    amountPaid: 200,
    items: [
      { productName: 'Bloom Special Burger', quantity: 1, unitPrice: 150 },
      { productName: 'Fresh Draught Drink', quantity: 1, unitPrice: 50 },
    ],
  };

  try {
    await printReceipt(printer, sampleOrder, {
      hotelName: 'Bloom Bar & Restaurant',
      headerLine2: 'TCP Network Print Test Passed',
      footerLine: `TCP OK • ${printer.brand || 'Epson'} • ${printer.paperWidth || '60×80mm'}`.trim(),
    });
    res.json({ ok: true, message: `Test page sent to ${printer.ipAddress}:${printer.port || 9100}` });
  } catch (err) {
    // If direct print fails (cloud host), dispatch to local print agent on LAN!
    if (hasActiveRelayAgent()) {
      const relayRes = await dispatchToRelay('test_page', {
        printer,
        sampleOrder,
        opts: {
          hotelName: 'Bloom Bar & Restaurant',
          headerLine2: 'TCP Network Print Test Passed',
          footerLine: `TCP OK • ${printer.brand || 'Epson'} • ${printer.paperWidth || '60×80mm'}`.trim(),
        },
      });
      if (relayRes.ok) {
        return res.json({ ok: true, via: 'relay_agent', message: `Test page printed to ${printer.ipAddress}:${printer.port || 9100} via Local Agent!` });
      }
    }
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── RELAY AGENT ENDPOINTS ───────────────────────────────────────────────────

// Agent long-poll endpoint
const relayPollEndpoint = asyncHandler(async (req, res) => {
  lastRelayAgentHeartbeat = Date.now();

  if (relayJobQueue.length > 0) {
    const jobs = [...relayJobQueue];
    relayJobQueue = [];
    return res.json({ jobs });
  }

  relayAgentWaiters.push(res);
  req.on('close', () => {
    relayAgentWaiters = relayAgentWaiters.filter((r) => r !== res);
  });
  setTimeout(() => {
    relayAgentWaiters = relayAgentWaiters.filter((r) => r !== res);
    if (!res.headersSent) {
      res.json({ jobs: [] });
    }
  }, 25000);
});

// Agent completion endpoint
const relayCompleteEndpoint = asyncHandler(async (req, res) => {
  lastRelayAgentHeartbeat = Date.now();
  const { jobId, result } = req.body;
  if (!jobId) return res.status(400).json({ ok: false, error: 'jobId required' });

  const entry = pendingRelayJobs.get(jobId);
  if (entry) {
    clearTimeout(entry.timer);
    pendingRelayJobs.delete(jobId);
    entry.resolve(result || { ok: true });
  }
  res.json({ ok: true });
});

// Relay status endpoint
const relayStatusEndpoint = asyncHandler(async (req, res) => {
  const online = hasActiveRelayAgent();
  const secondsAgo = Math.round((Date.now() - lastRelayAgentHeartbeat) / 1000);
  res.json({
    online,
    lastSeenSecondsAgo: lastRelayAgentHeartbeat ? secondsAgo : null,
    pendingJobs: relayJobQueue.length,
  });
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
  printTestPageEndpoint,
  relayPollEndpoint,
  relayCompleteEndpoint,
  relayStatusEndpoint,
};
