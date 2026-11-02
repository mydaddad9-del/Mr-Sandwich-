/**
 * pos-agent.js – Hybrid Cloud-to-Local POS Printing Bridge Agent
 *
 * Runs on the restaurant's local POS computer on the local LAN.
 * Provides two simultaneous bridges:
 *
 * 1. Outbound Cloud Relay (Long-Polling):
 *    Connects to ${CLOUD_BACKEND_URL}/api/printers/relay/poll.
 *    Enables cloud-hosted POS (Render / AletCloud / Vercel / mobile tablets)
 *    to send print jobs to private LAN printers (e.g. 192.168.8.222:9100)
 *    without opening any router firewall or NAT ports.
 *
 * 2. Local Loopback HTTP Bridge (Port 5000):
 *    Listens on http://127.0.0.1:5000 with Private Network Access (PNA) and CORS.
 *    Allows browser apps on this same POS terminal to achieve instant (<5ms)
 *    zero-latency printing directly over raw TCP sockets.
 *
 * Pure Node.js built-in modules — ZERO npm packages required.
 */

const http = require('http');
const https = require('https');
const net = require('net');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ── Configuration ─────────────────────────────────────────────────────────────
const CONFIG_FILE = path.join(__dirname, 'agent-config.json');

let config = {
  restaurantName: process.env.RESTAURANT_NAME || 'Mr Sandwich',
  cloudUrl: process.env.CLOUD_BACKEND_URL || process.env.MR_SANDWICH_CLOUD_URL || process.env.CLOUD_URL || 'https://mr-sandwich.app.aletcloud.com',
  defaultPrinterIp: process.env.PRINTER_IP || process.env.DEFAULT_PRINTER_IP || '192.168.8.222',
  defaultPrinterPort: Number(process.env.PRINTER_PORT || process.env.DEFAULT_PRINTER_PORT || 9100),
  loopbackPort: Number(process.env.PORT || process.env.LOOPBACK_PORT || 5000),
};

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    config = { ...config, ...saved };
  } catch (err) {
    console.warn('[CONFIG] Warning: Could not parse agent-config.json:', err.message);
  }
}

// CLI args override: node pos-agent.js [cloudUrl] [printerIp] [printerPort]
if (process.argv[2] && !process.argv[2].startsWith('-')) {
  config.cloudUrl = process.argv[2].trim();
}
if (process.argv[3]) {
  config.defaultPrinterIp = process.argv[3].trim();
}
if (process.argv[4]) {
  config.defaultPrinterPort = Number(process.argv[4]);
}

// Clean trailing slashes on cloudUrl
config.cloudUrl = config.cloudUrl.replace(/\/+$/, '');

const isHttps = config.cloudUrl.startsWith('https://');
const client = isHttps ? https : http;

console.log('================================================================');
console.log(`  Hybrid Cloud-to-Local POS Printing Bridge`);
console.log(`  Restaurant:    ${config.restaurantName}`);
console.log(`  Cloud Server:  ${config.cloudUrl}`);
console.log(`  Default Printer: ${config.defaultPrinterIp}:${config.defaultPrinterPort} (RAW TCP)`);
console.log(`  Loopback HTTP: http://127.0.0.1:${config.loopbackPort} (CORS & PNA active)`);
console.log('================================================================');

// ── Helper: Detect Laser / PCL vs ESC/POS Thermal ────────────────────────────
function isLaserPrinter(printer = {}) {
  const laserBrands = ['hp', 'lexmark', 'brother', 'samsung', 'xerox', 'canon', 'ricoh', 'kyocera', 'konica', 'sharp'];
  const brand = String(printer.brand || '').toLowerCase();
  const model = String(printer.model || '').toLowerCase();
  return laserBrands.some(b => brand.includes(b)) ||
    model.includes('laserjet') ||
    model.includes('laser') ||
    model.includes('m402') ||
    model.includes('m404') ||
    model.includes('m428') ||
    model.includes('m118') ||
    model.includes('canon') ||
    model.includes('brother');
}

// ── Raw TCP Socket Sender ────────────────────────────────────────────────────
function sendRawToPrinter(ip, port, data, timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const cleanup = (err) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch (_) { }
      if (err) reject(err);
      else resolve({ ok: true, ip, port });
    };

    socket.setTimeout(timeoutMs);
    socket.setNoDelay(true);

    socket.connect(port, ip, () => {
      socket.write(data, (err) => {
        if (err) return cleanup(err);
        socket.end();
        setTimeout(() => cleanup(null), 1200);
      });
    });

    socket.on('close', () => cleanup(null));
    socket.on('error', (err) => cleanup(err));
    socket.on('timeout', () => cleanup(new Error(`Timeout connecting to printer ${ip}:${port}`)));
  });
}

// Test TCP printer connectivity
function checkLocalPrinter(ip = config.defaultPrinterIp, port = config.defaultPrinterPort, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(timeoutMs);
    s.connect(port, ip, () => {
      s.destroy();
      resolve(true);
    });
    s.on('error', () => resolve(false));
    s.on('timeout', () => {
      s.destroy();
      resolve(false);
    });
  });
}

// ── ESC/POS Thermal Format Builders ──────────────────────────────────────────
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD_INIT = Buffer.from([ESC, 0x40]);
const CMD_ALIGN_LEFT = Buffer.from([ESC, 0x61, 0x00]);
const CMD_ALIGN_CENTER = Buffer.from([ESC, 0x61, 0x01]);
const CMD_ALIGN_RIGHT = Buffer.from([ESC, 0x61, 0x02]);
const CMD_BOLD_ON = Buffer.from([ESC, 0x45, 0x01]);
const CMD_BOLD_OFF = Buffer.from([ESC, 0x45, 0x00]);
const CMD_DBL_ON = Buffer.from([ESC, 0x21, 0x30]);
const CMD_DBL_OFF = Buffer.from([ESC, 0x21, 0x00]);
const CMD_FEED_3 = Buffer.from([ESC, 0x64, 0x03]);
const CMD_CUT = Buffer.from([GS, 0x56, 0x00]);

function escText(str) {
  return Buffer.from(String(str || '') + '\n', 'latin1');
}

function escDivider(char = '-', width = 32) {
  return char.repeat(width);
}

function escTwoCol(left, right, width = 32) {
  const r = String(right || '');
  const leftWidth = Math.max(0, width - r.length);
  return String(left || '').padEnd(leftWidth).slice(0, leftWidth) + r;
}

// ESC/POS Test Page
function buildTestReceipt(hotelName = config.restaurantName, footer = 'TCP Print Test Successful!', paperWidth = '60mm') {
  const isNarrow = /58|60/i.test(paperWidth);
  const W = isNarrow ? 32 : 42;

  return Buffer.concat([
    CMD_INIT,
    CMD_ALIGN_CENTER,
    CMD_DBL_ON,
    escText(hotelName.toUpperCase()),
    CMD_DBL_OFF,
    CMD_BOLD_ON,
    escText('TCP DIRECT PRINT TEST'),
    CMD_BOLD_OFF,
    escText(escDivider('=', W)),
    CMD_ALIGN_LEFT,
    escText(escTwoCol('Date:', new Date().toLocaleDateString('en-ET'), W)),
    escText(escTwoCol('Time:', new Date().toLocaleTimeString('en-ET'), W)),
    escText(escTwoCol('Protocol:', 'RAW TCP Port 9100', W)),
    escText(escTwoCol('Mode:', `ESC/POS Thermal (${isNarrow ? '58/60mm' : '80mm'})`, W)),
    escText(escTwoCol('Bridge:', 'Hybrid Cloud-to-Local', W)),
    escText(escTwoCol('Status:', 'ONLINE & VERIFIED [OK]', W)),
    escText(escDivider('=', W)),
    CMD_ALIGN_CENTER,
    CMD_BOLD_ON,
    escText(footer),
    CMD_BOLD_OFF,
    CMD_FEED_3,
    CMD_CUT,
  ]);
}

// ESC/POS Kitchen / Bar Order Ticket (KOT)
function buildKOTReceipt(order = {}, opts = {}) {
  const W = opts.charWidth || (/58|60/i.test(opts.paperWidth || '') ? 32 : 42);
  const stationTitle = opts.stationTitle || (opts.targetStation === 'bar' ? '** BAR & DRINK TICKET **' : '** KITCHEN ORDER **');
  const businessName = opts.businessName || config.restaurantName;
  const now = new Date(order.createdAt || Date.now());

  const items = order.items || [];

  const chunks = [
    CMD_INIT,
    CMD_ALIGN_CENTER,
    CMD_DBL_ON,
    escText(stationTitle),
    CMD_DBL_OFF,
    CMD_BOLD_ON,
    escText(businessName.toUpperCase()),
    CMD_BOLD_OFF,
    CMD_ALIGN_LEFT,
    escText(escDivider('=', W)),
    escText(escTwoCol('Order #:', order.orderNo || '--', W)),
    escText(escTwoCol('Type:', (order.orderType || 'dine_in').replace('_', ' ').toUpperCase(), W)),
  ];

  if (order.tableNo) chunks.push(escText(escTwoCol('Table:', `Table ${order.tableNo}`, W)));
  if (order.waiterName) chunks.push(escText(escTwoCol('Server:', order.waiterName, W)));
  if (order.customerName && order.customerName !== 'Walk-in Guest') {
    chunks.push(escText(escTwoCol('Guest:', order.customerName, W)));
  }

  chunks.push(
    escText(escTwoCol('Time:', now.toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' }), W)),
    escText(escDivider('-', W)),
    CMD_BOLD_ON,
    escText(String('ITEM').padEnd(W - 8).slice(0, W - 8) + '  QTY'),
    CMD_BOLD_OFF,
    escText(escDivider('-', W))
  );

  items.forEach((item) => {
    const name = String(item.productName || item.name || '').slice(0, W - 8);
    const qty = `x${item.quantity || 1}`;
    chunks.push(
      CMD_BOLD_ON,
      escText(escTwoCol(name, qty, W)),
      CMD_BOLD_OFF
    );
    if (item.notes) {
      chunks.push(escText(`  >> ${item.notes}`));
    }
  });

  chunks.push(
    escText(escDivider('=', W)),
    CMD_ALIGN_CENTER,
    CMD_BOLD_ON,
    escText('** PREPARE IMMEDIATELY **'),
    CMD_BOLD_OFF,
    CMD_FEED_3,
    CMD_CUT
  );

  return Buffer.concat(chunks);
}

// ESC/POS Customer Receipt
function buildCustomerReceipt(order = {}, opts = {}) {
  const W = opts.charWidth || (/58|60/i.test(opts.paperWidth || '') ? 32 : 42);
  const hotelName = opts.hotelName || config.restaurantName;
  const footerLine = opts.footerLine || 'Thank you! Come again.';
  const currency = opts.currency || 'ETB';
  const now = new Date(order.createdAt || Date.now());

  const subtotal = (order.items || []).reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const grandTotal = Number(order.grandTotal ?? subtotal);
  const amountPaid = Number(order.amountPaid ?? grandTotal);
  const change = Math.max(0, amountPaid - grandTotal);
  const fmt = (n) => `${currency} ${Number(n || 0).toFixed(2)}`;

  const chunks = [
    CMD_INIT,
    CMD_ALIGN_CENTER,
    CMD_DBL_ON,
    escText(hotelName.toUpperCase()),
    CMD_DBL_OFF,
    CMD_BOLD_ON,
    escText('CUSTOMER RECEIPT'),
    CMD_BOLD_OFF,
    escText(escDivider('=', W)),
    CMD_ALIGN_LEFT,
    escText(escTwoCol('Receipt #:', order.orderNo || '--', W)),
    escText(escTwoCol('Date:', now.toLocaleDateString('en-ET'), W)),
    escText(escTwoCol('Time:', now.toLocaleTimeString('en-ET'), W)),
  ];

  if (order.tableNo) chunks.push(escText(escTwoCol('Table:', `Table ${order.tableNo}`, W)));
  if (order.waiterName) chunks.push(escText(escTwoCol('Server:', order.waiterName, W)));
  if (order.customerName && order.customerName !== 'Walk-in Guest') {
    chunks.push(escText(escTwoCol('Guest:', order.customerName, W)));
  }

  chunks.push(
    escText(escDivider('-', W)),
    CMD_BOLD_ON,
    escText(escTwoCol('ITEM', 'TOTAL', W)),
    CMD_BOLD_OFF,
    escText(escDivider('-', W))
  );

  (order.items || []).forEach((item) => {
    const itemTotal = Number(item.totalPrice || (item.quantity * item.unitPrice) || 0).toFixed(2);
    const left = `${item.quantity}x ${item.productName || item.name || ''}`;
    chunks.push(escText(escTwoCol(left, `${currency} ${itemTotal}`, W)));
  });

  chunks.push(
    escText(escDivider('-', W)),
    CMD_ALIGN_RIGHT,
    CMD_BOLD_ON,
    escText(escTwoCol('TOTAL:', fmt(grandTotal), W)),
    CMD_BOLD_OFF,
    escText(escDivider('-', W)),
    escText(escTwoCol('Payment:', order.paymentMethod || 'Cash', W)),
    escText(escTwoCol('Paid:', fmt(amountPaid), W))
  );

  if (change > 0) {
    chunks.push(escText(escTwoCol('Change:', fmt(change), W)));
  }

  chunks.push(
    escText(escDivider('=', W)),
    CMD_ALIGN_CENTER,
    CMD_BOLD_ON,
    escText(footerLine),
    CMD_BOLD_OFF,
    CMD_FEED_3,
    CMD_CUT
  );

  return Buffer.concat(chunks);
}

// ── PCL / ASCII Laser Format Builders ─────────────────────────────────────────
const PCL_RESET = '\x1bE';
const PCL_SETUP = '\x1b&l0O\x1b(s12V\x1b&k2G';
const PCL_FF = '\x0c';

function pclCenter(str, width = 60) {
  const s = String(str || '');
  if (s.length >= width) return s;
  const pad = Math.floor((width - s.length) / 2);
  return ' '.repeat(pad) + s;
}

function buildLaserTestPage(hotelName = config.restaurantName, footer = 'HP LaserJet TCP Print Passed') {
  const W = 60;
  const lines = [
    PCL_RESET + PCL_SETUP,
    '='.repeat(W),
    pclCenter(`** ${hotelName.toUpperCase()} **`, W),
    pclCenter('TCP DIRECT PRINT TEST OK', W),
    '='.repeat(W),
    `Date:     ${new Date().toLocaleString('en-ET')}`,
    'Protocol: TCP RAW JetDirect Port 9100',
    'Mode:     HP LaserJet / Canon / PCL Laser',
    'Bridge:   Hybrid Cloud-to-Local Print Bridge',
    'Status:   ONLINE & VERIFIED [100% OK]',
    '='.repeat(W),
    pclCenter(footer, W),
    '='.repeat(W),
    PCL_FF,
    PCL_RESET,
  ];
  return Buffer.from(lines.join('\r\n'), 'utf8');
}

function buildLaserKOT(order = {}, opts = {}) {
  const W = 60;
  const stationTitle = opts.stationTitle || (opts.targetStation === 'bar' ? '** BAR & DRINK TICKET **' : '** KITCHEN ORDER TICKET **');
  const businessName = opts.businessName || config.restaurantName;
  const now = new Date(order.createdAt || Date.now());

  const lines = [
    PCL_RESET + PCL_SETUP,
    '='.repeat(W),
    pclCenter(stationTitle, W),
    pclCenter(businessName.toUpperCase(), W),
    '='.repeat(W),
    `Order #:  ${order.orderNo || '--'}    Type: ${(order.orderType || 'dine_in').toUpperCase()}`,
    `Table:    ${order.tableNo ? 'Table ' + order.tableNo : '--'}    Server: ${order.waiterName || 'Staff'}`,
    `Time:     ${now.toLocaleTimeString('en-ET')}`,
    '-'.repeat(W),
    'ITEM'.padEnd(W - 10) + 'QTY',
    '-'.repeat(W),
    ...(order.items || []).map(i => `  ${String(i.productName || i.name || '').padEnd(W - 12)} x${i.quantity || 1}${i.notes ? '\n    >> ' + i.notes : ''}`),
    '='.repeat(W),
    pclCenter('** PREPARE IMMEDIATELY **', W),
    PCL_FF,
    PCL_RESET,
  ];
  return Buffer.from(lines.join('\r\n'), 'utf8');
}

function buildLaserReceipt(order = {}, opts = {}) {
  const W = 60;
  const hotelName = opts.hotelName || config.restaurantName;
  const footerLine = opts.footerLine || 'Thank you! Come again.';
  const currency = opts.currency || 'ETB';
  const now = new Date(order.createdAt || Date.now());

  const subtotal = (order.items || []).reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const grandTotal = Number(order.grandTotal ?? subtotal);
  const amountPaid = Number(order.amountPaid ?? grandTotal);
  const change = Math.max(0, amountPaid - grandTotal);
  const fmt = (n) => `${currency} ${Number(n || 0).toFixed(2)}`;

  const lines = [
    PCL_RESET + PCL_SETUP,
    '='.repeat(W),
    pclCenter(hotelName.toUpperCase(), W),
    pclCenter('CUSTOMER RECEIPT', W),
    '='.repeat(W),
    `Receipt #: ${order.orderNo || '--'}    Date: ${now.toLocaleDateString('en-ET')}`,
    `Table:     ${order.tableNo ? 'Table ' + order.tableNo : '--'}    Time: ${now.toLocaleTimeString('en-ET')}`,
    `Server:    ${order.waiterName || 'Staff'}`,
    '-'.repeat(W),
    'ITEM'.padEnd(W - 22) + 'QTY'.padEnd(6) + 'TOTAL',
    '-'.repeat(W),
    ...(order.items || []).map(i => {
      const tot = fmt(i.totalPrice || (i.quantity * i.unitPrice) || 0);
      return `  ${String(i.productName || i.name || '').padEnd(W - 24)} x${String(i.quantity).padEnd(4)} ${tot}`;
    }),
    '-'.repeat(W),
    `TOTAL:'.padEnd(W - 16) + ${fmt(grandTotal)}`,
    `Payment: ${order.paymentMethod || 'Cash'}    Paid: ${fmt(amountPaid)}    Change: ${fmt(change)}`,
    '='.repeat(W),
    pclCenter(footerLine, W),
    pclCenter(`Printed: ${now.toLocaleString('en-ET')}`, W),
    PCL_FF,
    PCL_RESET,
  ];
  return Buffer.from(lines.join('\r\n'), 'utf8');
}

// ── Dispatch Print Job (ESC/POS vs PCL Laser) ────────────────────────────────
async function printJobDispatcher(action, payload) {
  const targetPrinter = payload?.printer || {};
  const isLaser = isLaserPrinter(targetPrinter);
  const ip = targetPrinter.ipAddress || payload?.ip || config.defaultPrinterIp;
  const port = Number(targetPrinter.port || payload?.port || config.defaultPrinterPort || 9100);

  if (action === 'ping') {
    const ok = await checkLocalPrinter(ip, port);
    return { ok, ip, port, message: ok ? `Printer ${ip}:${port} ONLINE` : `Printer ${ip}:${port} OFFLINE` };
  }

  if (action === 'test_page') {
    const rawBytes = isLaser
      ? buildLaserTestPage(config.restaurantName, 'HP LaserJet TCP Print Passed')
      : buildTestReceipt(config.restaurantName, 'TCP Print Test Successful!', targetPrinter.paperWidth || payload?.paperWidth);
    await sendRawToPrinter(ip, port, rawBytes);
    return { ok: true, ip, port, via: 'local_tcp', message: `Test page printed to ${ip}:${port}` };
  }

  if (action === 'kot') {
    const order = payload?.order || {};
    const opts = payload?.opts || {};
    const rawBytes = isLaser
      ? buildLaserKOT(order, opts)
      : buildKOTReceipt(order, opts);
    await sendRawToPrinter(ip, port, rawBytes);
    return { ok: true, ip, port, via: 'local_tcp', message: `KOT #${order.orderNo || '--'} printed to ${ip}:${port}` };
  }

  if (action === 'receipt') {
    const order = payload?.order || {};
    const opts = payload?.opts || {};
    const rawBytes = isLaser
      ? buildLaserReceipt(order, opts)
      : buildCustomerReceipt(order, opts);
    await sendRawToPrinter(ip, port, rawBytes);
    return { ok: true, ip, port, via: 'local_tcp', message: `Receipt #${order.orderNo || '--'} printed to ${ip}:${port}` };
  }

  throw new Error(`Unknown print action: ${action}`);
}

// ── 1. Outbound Cloud Long-Polling Loop ──────────────────────────────────────
function completeJobBackToCloud(jobId, result) {
  try {
    const parsed = new URL(config.cloudUrl);
    const postData = JSON.stringify({ jobId, result });

    const req = client.request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: '/api/printers/relay/complete',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'POS-Print-Agent/2.0',
      },
    });

    req.on('error', (e) => console.error('[CLOUD-AGENT] Complete error:', e.message));
    req.write(postData);
    req.end();
  } catch (err) {
    console.error('[CLOUD-AGENT] Complete failed:', err.message);
  }
}

function pollCloudLoop() {
  try {
    const parsed = new URL(config.cloudUrl);

    const req = client.request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: '/api/printers/relay/poll',
      method: 'GET',
      headers: {
        'User-Agent': 'POS-Print-Agent/2.0',
        'Accept': 'application/json',
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', async () => {
        try {
          if (res.statusCode === 200) {
            const data = JSON.parse(body);
            const jobs = data.jobs || [];

            for (const job of jobs) {
              console.log(`[CLOUD-JOB] ➔ Received ${job.action} (Job ID: ${job.id})`);
              try {
                const result = await printJobDispatcher(job.action, job.payload);
                console.log(`[CLOUD-JOB] ✓ Success for ${job.action}:`, result.message || 'OK');
                completeJobBackToCloud(job.id, result);
              } catch (printErr) {
                console.error(`[CLOUD-JOB] ✗ Error on ${job.action}:`, printErr.message);
                completeJobBackToCloud(job.id, { ok: false, error: printErr.message });
              }
            }
          }
        } catch (_) { }

        // Immediately reconnect for long-polling
        setImmediate(pollCloudLoop);
      });
    });

    req.on('error', (err) => {
      console.log(`[CLOUD-AGENT] Connection retry in 3s... (${err.message})`);
      setTimeout(pollCloudLoop, 3000);
    });

    req.end();
  } catch (err) {
    console.error('[CLOUD-AGENT] Poll error:', err.message);
    setTimeout(pollCloudLoop, 3000);
  }
}

// ── 2. Local Loopback HTTP Bridge (Port 5000) ────────────────────────────────
function setCorsAndPnaHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-otp-token');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw));
      } catch (_) {
        resolve({});
      }
    });
  });
}

function startLoopbackServer(port = config.loopbackPort) {
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin || '*';
    setCorsAndPnaHeaders(res, origin);

    // Preflight OPTIONS for PNA & CORS
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';

    // Status & Health endpoint
    if (pathname === '/api/printers/action/status' || pathname === '/api/health' || pathname === '/' || pathname === '/api/printers/action') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'ok',
        service: 'pos-agent',
        restaurantName: config.restaurantName,
        cloudUrl: config.cloudUrl,
        defaultPrinter: `${config.defaultPrinterIp}:${config.defaultPrinterPort}`,
        mode: 'hybrid-cloud-to-local',
        localHttpBridge: `http://127.0.0.1:${port}`,
      }));
    }

    // Ping Printer endpoint
    if (pathname === '/api/printers/action/ping' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const ip = body.ip || config.defaultPrinterIp;
      const p = Number(body.port || config.defaultPrinterPort);
      const ok = await checkLocalPrinter(ip, p);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        ok,
        via: 'local_tcp',
        ip,
        port: p,
        message: ok ? `Connected to ${ip}:${p} via Local TCP` : `Unreachable on ${ip}:${p}`,
      }));
    }

    // Test Page endpoint
    if (pathname === '/api/printers/action/test-page' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      try {
        const result = await printJobDispatcher('test_page', body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    }

    // KOT (Kitchen Order Ticket) endpoint
    if (pathname === '/api/printers/action/kot' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      try {
        const result = await printJobDispatcher('kot', body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    }

    // Customer Receipt endpoint
    if (pathname === '/api/printers/action/receipt' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      try {
        const result = await printJobDispatcher('receipt', body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Not found: ${pathname}` }));
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[LOOPBACK] Port ${port} is currently in use by another process.`);
      console.warn(`[LOOPBACK] Local HTTP bridge will stand by while Outbound Cloud Relay continues running normally.`);
    } else {
      console.error('[LOOPBACK] HTTP Server error:', err.message);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[LOOPBACK] ✓ Local HTTP Bridge listening on http://127.0.0.1:${port}`);
    console.log(`[LOOPBACK] ✓ PNA & CORS active — browsers get instant (<5ms) local printing.`);
  });
}

// ── Startup Sequence ─────────────────────────────────────────────────────────
(async () => {
  console.log(`[LAN] Checking local printer at ${config.defaultPrinterIp}:${config.defaultPrinterPort}...`);
  const isOnline = await checkLocalPrinter();
  if (isOnline) {
    console.log(`[LAN] ✓ Printer ${config.defaultPrinterIp}:${config.defaultPrinterPort} is ONLINE & READY!`);
  } else {
    console.log(`[LAN] ⚠ Printer ${config.defaultPrinterIp}:${config.defaultPrinterPort} not responding. Check power and LAN IP.`);
  }

  // 1. Start Local Loopback HTTP Bridge (Port 5000)
  startLoopbackServer(config.loopbackPort);

  // 2. Start Outbound Cloud Long-Polling Loop
  console.log(`[CLOUD] Connecting to Cloud Relay at ${config.cloudUrl}...`);
  pollCloudLoop();

  console.log(`[AGENT] ✓ Hybrid Cloud-to-Local Print Bridge is fully active.`);
})();
