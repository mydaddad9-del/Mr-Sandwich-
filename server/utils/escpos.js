/**
 * escpos.js – Pure Node.js ESC/POS command builder.
 *
 * Supports all standard ESC/POS thermal printers:
 *   Epson TM-T20, TM-T88, TM-T82, TM-T70
 *   Star TSP100, TSP650, TSP700, TSP800
 *   Datecs DP-25, DP-50, WP-500
 *   Citizen CT-E351, CT-S310
 *   Bixolon SRP-350
 *   Generic 80mm/58mm POS printers
 *
 * All printers above use ESC/POS protocol over TCP port 9100 (raw socket).
 */

const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;
const CR  = 0x0d;

// ── Text alignment constants ────────────────────────────────────────────────
const ALIGN_LEFT   = Buffer.from([ESC, 0x61, 0x00]);
const ALIGN_CENTER = Buffer.from([ESC, 0x61, 0x01]);
const ALIGN_RIGHT  = Buffer.from([ESC, 0x61, 0x02]);

// ── Text style constants ────────────────────────────────────────────────────
const BOLD_ON   = Buffer.from([ESC, 0x45, 0x01]);
const BOLD_OFF  = Buffer.from([ESC, 0x45, 0x00]);
const DOUBLE_HEIGHT_ON  = Buffer.from([ESC, 0x21, 0x10]);
const DOUBLE_HEIGHT_OFF = Buffer.from([ESC, 0x21, 0x00]);
const DOUBLE_SIZE_ON    = Buffer.from([ESC, 0x21, 0x30]);
const DOUBLE_SIZE_OFF   = Buffer.from([ESC, 0x21, 0x00]);

// ── Feed & cut ───────────────────────────────────────────────────────────────
const LINE_FEED = Buffer.from([LF]);
const FEED_3    = Buffer.from([ESC, 0x64, 3]);
const FEED_5    = Buffer.from([ESC, 0x64, 5]);

// Full cut (cutter not on all models, safe to send – ignored if no cutter)
const CUT_FULL  = Buffer.from([GS, 0x56, 0x00]);
const CUT_HALF  = Buffer.from([GS, 0x56, 0x01]);

// Initialise printer (reset)
const INIT = Buffer.from([ESC, 0x40]);

// ── Open cash drawer pulse ───────────────────────────────────────────────────
const OPEN_DRAWER = Buffer.from([ESC, 0x70, 0x00, 0x19, 0x78]);

/**
 * Pad or truncate a string to exactly `len` chars.
 */
function padEnd(str, len) {
  return String(str || '').padEnd(len).slice(0, len);
}

/**
 * Build a two-column row: left text + right text aligned to `totalWidth`.
 */
function twoCol(left, right, totalWidth = 42) {
  const rightStr = String(right || '');
  const leftWidth = totalWidth - rightStr.length;
  return padEnd(String(left || ''), leftWidth) + rightStr;
}

/**
 * Divider line of dashes.
 */
function divider(char = '-', width = 42) {
  return char.repeat(width);
}

/**
 * Convert a string to a Buffer using latin1 encoding (safe for ESC/POS).
 */
function text(str) {
  return Buffer.from(str + '\n', 'latin1');
}

// ─────────────────────────────────────────────────────────────────────────────
// KOT – Kitchen Order Ticket
// Sent to KITCHEN / BAR printer when order is placed.
// ─────────────────────────────────────────────────────────────────────────────
function buildKOT(order, opts = {}) {
  const W = opts.charWidth || 42;
  const businessName = opts.businessName || 'KITCHEN ORDER';
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-ET');

  const chunks = [
    INIT,
    ALIGN_CENTER,
    DOUBLE_SIZE_ON,
    text('** KITCHEN ORDER **'),
    DOUBLE_SIZE_OFF,
    BOLD_ON,
    text(businessName.toUpperCase()),
    BOLD_OFF,
    ALIGN_LEFT,
    LINE_FEED,
    text(divider('=', W)),
    text(twoCol('Order #:', order.orderNo || '--', W)),
    text(twoCol('Type:', (order.orderType || 'dine_in').replace('_', ' ').toUpperCase(), W)),
  ];

  if (order.tableNo) {
    chunks.push(text(twoCol('Table:', order.tableNo, W)));
  }
  if (order.waiterName) {
    chunks.push(text(twoCol('Waiter:', order.waiterName, W)));
  }
  if (order.customerName && order.customerName !== 'Walk-in Guest') {
    chunks.push(text(twoCol('Customer:', order.customerName, W)));
  }

  chunks.push(
    text(twoCol('Date:', dateStr, W)),
    text(twoCol('Time:', timeStr, W)),
    text(divider('=', W)),
    BOLD_ON,
    text(padEnd('ITEM', W - 10) + padEnd('QTY', 5) + 'NOTE'),
    BOLD_OFF,
    text(divider('-', W)),
  );

  (order.items || []).forEach((item) => {
    const name = String(item.productName || item.name || '').slice(0, W - 12);
    const qty  = String(item.quantity || 1);
    const note = String(item.notes || '').slice(0, 12);
    chunks.push(
      BOLD_ON,
      text(padEnd(name, W - 12) + padEnd(`x${qty}`, 5) + note),
      BOLD_OFF,
    );
    if (item.notes) {
      chunks.push(text(`  >> ${item.notes}`));
    }
  });

  chunks.push(
    text(divider('=', W)),
    ALIGN_CENTER,
    BOLD_ON,
    text('** PREPARE IMMEDIATELY **'),
    BOLD_OFF,
    ALIGN_LEFT,
    FEED_5,
    CUT_HALF,
  );

  return Buffer.concat(chunks);
}

// ─────────────────────────────────────────────────────────────────────────────
// RECEIPT – Customer receipt ticket
// Sent to RECEIPT printer on checkout/payment.
// ─────────────────────────────────────────────────────────────────────────────
function buildReceipt(order, opts = {}) {
  const W = opts.charWidth || 42;
  const hotelName   = opts.hotelName   || 'Baba Roti Café';
  const headerLine2 = opts.headerLine2 || '';
  const footerLine  = opts.footerLine  || 'Thank you! Come again.';
  const taxRate     = opts.taxRate || 15;
  const currency    = opts.currency || 'ETB';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-ET');
  const timeStr = now.toLocaleTimeString('en-ET', { hour: '2-digit', minute: '2-digit' });

  const subtotal   = (order.items || []).reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const discAmt    = subtotal * ((order.discountPercent || 0) / 100);
  const afterDisc  = subtotal - discAmt;
  const svcAmt     = (order.serviceCharge || 0);
  const taxAmt     = afterDisc * (taxRate / 100);
  const grandTotal = afterDisc + svcAmt + taxAmt;
  const amountPaid = order.amountPaid || grandTotal;
  const change     = amountPaid - grandTotal;

  const fmt = (n) => `${currency} ${Number(n || 0).toFixed(2)}`;

  const chunks = [
    INIT,
    ALIGN_CENTER,
    DOUBLE_SIZE_ON,
    text(hotelName.toUpperCase()),
    DOUBLE_SIZE_OFF,
  ];

  if (headerLine2) {
    chunks.push(text(headerLine2));
  }

  chunks.push(
    LINE_FEED,
    text('* RECEIPT *'),
    ALIGN_LEFT,
    text(divider('=', W)),
    text(twoCol('Receipt #:', order.orderNo || '--', W)),
    text(twoCol('Date:', dateStr, W)),
    text(twoCol('Time:', timeStr, W)),
  );

  if (order.tableNo) {
    chunks.push(text(twoCol('Table:', order.tableNo, W)));
  }
  if (order.waiterName) {
    chunks.push(text(twoCol('Server:', order.waiterName, W)));
  }
  if (order.customerName && order.customerName !== 'Walk-in Guest') {
    chunks.push(text(twoCol('Guest:', order.customerName, W)));
  }

  chunks.push(
    text(divider('-', W)),
    BOLD_ON,
    text(padEnd('ITEM', W - 20) + padEnd('QTY', 5) + padEnd('PRICE', 8) + 'TOTAL'),
    BOLD_OFF,
    text(divider('-', W)),
  );

  (order.items || []).forEach((item) => {
    const name  = String(item.productName || item.name || '').slice(0, W - 20);
    const qty   = String(item.quantity || 1);
    const price = fmt(item.unitPrice).slice(-8);
    const total = fmt(item.quantity * item.unitPrice).slice(-8);
    chunks.push(text(padEnd(name, W - 20) + padEnd(`x${qty}`, 5) + padEnd(price, 8) + total));
  });

  chunks.push(text(divider('-', W)));

  if (discAmt > 0) {
    chunks.push(text(twoCol(`Discount (${order.discountPercent}%):`, `-${fmt(discAmt)}`, W)));
  }
  if (svcAmt > 0) {
    chunks.push(text(twoCol('Service Charge:', fmt(svcAmt), W)));
  }
  chunks.push(
    text(twoCol(`Tax (${taxRate}%):`, fmt(taxAmt), W)),
    text(divider('=', W)),
    BOLD_ON,
    DOUBLE_HEIGHT_ON,
    text(twoCol('TOTAL:', fmt(grandTotal), W)),
    DOUBLE_HEIGHT_OFF,
    BOLD_OFF,
    text(divider('-', W)),
    text(twoCol('Payment:', order.paymentMethod || 'Cash', W)),
    text(twoCol('Paid:', fmt(amountPaid), W)),
  );

  if (change > 0) {
    chunks.push(text(twoCol('Change:', fmt(change), W)));
  }

  chunks.push(
    text(divider('=', W)),
    ALIGN_CENTER,
    LINE_FEED,
    text(footerLine),
    LINE_FEED,
    text(`Printed: ${dateStr} ${timeStr}`),
    LINE_FEED,
    FEED_5,
    CUT_HALF,
  );

  return Buffer.concat(chunks);
}

module.exports = { buildKOT, buildReceipt, OPEN_DRAWER };
