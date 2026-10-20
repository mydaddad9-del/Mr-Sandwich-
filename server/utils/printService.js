/**
 * printService.js – Sends ESC/POS print jobs to network thermal printers
 * via raw TCP socket (port 9100 by default).
 *
 * No external npm packages required — uses Node.js built-in `net` module.
 */

const net  = require('net');
const { buildKOT, buildReceipt, buildKOT_plain, buildReceipt_plain } = require('./escpos');

const CONNECT_TIMEOUT_MS = 5000;
const WRITE_TIMEOUT_MS   = 8000;

/**
 * Send raw bytes to a TCP printer.
 * @param {string} ip
 * @param {number} port
 * @param {Buffer} data
 * @returns {Promise<void>}
 */
function sendToPrinter(ip, port, data) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (err) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve();
    };

    const connectTimer = setTimeout(() => done(new Error(`Printer connection timeout (${ip}:${port})`)), CONNECT_TIMEOUT_MS);

    socket.connect(port, ip, () => {
      clearTimeout(connectTimer);

      const writeTimer = setTimeout(() => done(new Error('Printer write timeout')), WRITE_TIMEOUT_MS);

      socket.write(data, (err) => {
        clearTimeout(writeTimer);
        if (err) done(err);
        else {
          // Allow printer buffer to flush before closing
          setTimeout(() => done(), 500);
        }
      });
    });

    socket.on('error', (err) => {
      clearTimeout(connectTimer);
      done(err);
    });
  });
}

/**
 * Returns true if the printer brand is a laser/PCL printer (not ESC/POS thermal).
 */
function isLaserPrinter(printer) {
  const laserBrands = ['hp', 'lexmark', 'brother', 'samsung', 'xerox', 'canon', 'ricoh', 'kyocera', 'konica', 'sharp'];
  const brand = String(printer.brand || '').toLowerCase();
  const model = String(printer.model || '').toLowerCase();
  return laserBrands.some(b => brand.includes(b)) ||
         model.includes('laserjet') ||
         model.includes('laser') ||
         model.includes('m402') ||
         model.includes('m404') ||
         model.includes('m428') ||
         model.includes('m118');
}

/**
 * Print a KOT (Kitchen Order Ticket) to the given printer config.
 * Auto-detects ESC/POS thermal vs HP LaserJet/PCL laser.
 * @param {Object} printer  – PrinterSettings document
 * @param {Object} order    – order object with items, tableNo, waiterName, etc.
 * @param {Object} opts     – optional overrides { businessName, charWidth }
 */
async function printKOT(printer, order, opts = {}) {
  if (!printer.enabled) return;
  if (!printer.ipAddress) throw new Error('Printer IP address not configured');

  let data;
  if (isLaserPrinter(printer)) {
    // HP LaserJet / PCL plain-text mode
    data = buildKOT_plain(order, {
      businessName: opts.businessName || printer.headerLine1 || 'Kitchen Order',
      ...opts,
    });
  } else {
    // Standard ESC/POS thermal mode
    data = buildKOT(order, {
      charWidth:    printer.charWidth || 42,
      businessName: opts.businessName || printer.headerLine1 || 'Kitchen Order',
      ...opts,
    });
  }

  const copies = Math.max(1, Math.min(5, printer.copies || 1));
  const combined = Buffer.concat(Array(copies).fill(data));
  await sendToPrinter(printer.ipAddress, printer.port || 9100, combined);
}

/**
 * Print a customer receipt to the given printer config.
 * Auto-detects ESC/POS thermal vs HP LaserJet/PCL laser.
 * @param {Object} printer  – PrinterSettings document
 * @param {Object} order    – completed order with payment details
 * @param {Object} opts     – optional overrides { hotelName, taxRate, currency }
 */
async function printReceipt(printer, order, opts = {}) {
  if (!printer.enabled) return;
  if (!printer.ipAddress) throw new Error('Printer IP address not configured');

  let data;
  if (isLaserPrinter(printer)) {
    // HP LaserJet / PCL plain-text mode
    data = buildReceipt_plain(order, {
      hotelName:   opts.hotelName || printer.headerLine1 || 'Baba Roti Café',
      headerLine2: opts.headerLine2 || printer.headerLine2 || '',
      footerLine:  opts.footerLine || printer.footerLine || 'Thank you! Come again.',
      taxRate:     opts.taxRate ?? 15,
      currency:    opts.currency || 'ETB',
      ...opts,
    });
  } else {
    // Standard ESC/POS thermal mode
    data = buildReceipt(order, {
      charWidth:   printer.charWidth || 42,
      hotelName:   opts.hotelName || printer.headerLine1 || 'Baba Roti Café',
      headerLine2: opts.headerLine2 || printer.headerLine2 || '',
      footerLine:  opts.footerLine || printer.footerLine || 'Thank you! Come again.',
      taxRate:     opts.taxRate ?? 15,
      currency:    opts.currency || 'ETB',
      ...opts,
    });
  }

  const copies = Math.max(1, Math.min(5, printer.copies || 1));
  const combined = Buffer.concat(Array(copies).fill(data));
  await sendToPrinter(printer.ipAddress, printer.port || 9100, combined);
}

/**
 * Test connectivity to a printer by opening a socket and immediately closing.
 * Returns { ok: true } or { ok: false, error: '...' }.
 */
async function testPrinter(ip, port = 9100) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (ok, errMsg) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ ok, error: errMsg || null });
    };

    const timer = setTimeout(() => done(false, `Timeout connecting to ${ip}:${port}`), CONNECT_TIMEOUT_MS);

    socket.connect(port, ip, () => {
      clearTimeout(timer);
      done(true);
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      done(false, err.message);
    });
  });
}

module.exports = { printKOT, printReceipt, testPrinter, sendToPrinter };
