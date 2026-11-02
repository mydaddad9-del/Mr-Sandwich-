/**
 * localPrintDispatcher.js – Hybrid POS Thermal & Laser Printing Engine
 *
 * Enables 100% functional direct TCP/IP printing (Port 9100) even when the app
 * is hosted on the cloud (AletCloud / Render / Vercel):
 *
 * 1. Tries the local POS loopback bridge (http://127.0.0.1:5000) first for instant (<5ms)
 *    socket printing from POS terminals on the same machine.
 * 2. If the local bridge is not running or blocked, it seamlessly dispatches to
 *    the cloud API (/api/printers/action/...), which relays to the local agent
 *    via outbound long-polling without requiring open firewall ports.
 */

import api from '../api/axios';

const LOCAL_BRIDGE_URL = 'http://127.0.0.1:5000/api/printers/action';
const KNOWN_PRINTER_IPS = [
  '192.168.8.222',
  '192.168.1.100',
  '10.241.18.48',
  '192.168.1.200',
  '192.168.0.200',
];

/**
 * Check if the Cloud Relay Agent is currently connected & online.
 */
export async function getRelayStatus() {
  try {
    const res = await api.get('/printers/relay/status');
    return res.data || { online: false };
  } catch (_) {
    return { online: false };
  }
}

/**
 * Ping a printer IP over TCP port 9100.
 * Priority:
 *   1. Local loopback bridge (http://127.0.0.1:5000) – reaches local LAN printer in <5ms
 *   2. Main backend API (/api/printers/action/ping) – triggers cloud relay or direct TCP
 */
export async function pingPrinter(ip, port = 9100) {
  if (!ip) return { ok: false, error: 'IP address required' };

  // 1. Try local POS bridge first (direct local network socket)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const localRes = await fetch(`${LOCAL_BRIDGE_URL}/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, port: Number(port) }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (localRes.ok) {
      const data = await localRes.json();
      if (data.ok) {
        return { ok: true, via: 'local_tcp', message: `Connected to ${ip}:${port} via Local TCP` };
      }
    }
  } catch (_) {
    // Local bridge not active or blocked by browser mixed content, fall through to main API
  }

  // 2. Try main API (cloud or local backend)
  try {
    const res = await api.post('/printers/action/ping', { ip, port: Number(port) });
    if (res.data?.ok) {
      return { ok: true, via: 'api_tcp', message: `Connected to ${ip}:${port}` };
    }
    return { ok: false, error: res.data?.error || 'Unreachable' };
  } catch (err) {
    return { ok: false, error: err.response?.data?.error || err.message || 'Unreachable' };
  }
}

/**
 * Send a test print page directly via TCP port 9100.
 */
export async function printTestPage(printerOrForm) {
  const ip = printerOrForm.ipAddress || printerOrForm.ip;
  const port = Number(printerOrForm.port) || 9100;
  const brand = printerOrForm.brand || 'Epson';
  const model = printerOrForm.model || 'TM-T20III';
  const paperWidth = printerOrForm.paperWidth || '60mm';

  const payload = {
    ip,
    port,
    brand,
    model,
    paperWidth,
    printerId: printerOrForm._id,
  };

  // 1. Try local POS bridge first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const localRes = await fetch(`${LOCAL_BRIDGE_URL}/test-page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (localRes.ok) {
      const data = await localRes.json();
      if (data.ok) {
        return {
          ok: true,
          via: 'local_tcp',
          message: `✓ Test page printed directly to ${ip}:${port}!`,
        };
      }
    }
  } catch (_) {
    // Fall through
  }

  // 2. Try main API
  try {
    const res = await api.post('/printers/action/test-page', payload);
    if (res.data?.ok) {
      return {
        ok: true,
        via: res.data.via || 'api_tcp',
        message: res.data.message || `✓ Test page sent to ${ip}:${port}!`,
      };
    }
    return { ok: false, error: res.data?.error || 'Test print failed' };
  } catch (err) {
    return {
      ok: false,
      error: err.response?.data?.error || err.response?.data?.message || err.message || 'Test print failed',
    };
  }
}

/**
 * Send Kitchen / Bar Order Ticket (KOT) directly via network TCP printer.
 */
export async function sendOrderKOT(order, opts = {}) {
  const payload = {
    order,
    opts,
    printerId: opts?.printerId || order?.printerId,
  };

  // 1. Try local loopback bridge
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const localRes = await fetch(`${LOCAL_BRIDGE_URL}/kot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (localRes.ok) {
      const data = await localRes.json();
      return { ok: true, via: 'local_tcp', data };
    }
  } catch (_) {}

  // 2. Try cloud backend (relays to agent if cloud host)
  try {
    const res = await api.post('/printers/action/kot', payload);
    return { ok: true, via: 'api_tcp', data: res.data };
  } catch (err) {
    return { ok: false, error: err.response?.data?.message || err.message };
  }
}

/**
 * Send Customer Receipt directly via network TCP printer.
 */
export async function sendOrderReceipt(order, opts = {}) {
  const payload = {
    order,
    opts,
    printerId: opts?.printerId || order?.printerId,
  };

  // 1. Try local loopback bridge
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const localRes = await fetch(`${LOCAL_BRIDGE_URL}/receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (localRes.ok) {
      const data = await localRes.json();
      return { ok: true, via: 'local_tcp', data };
    }
  } catch (_) {}

  // 2. Try cloud backend
  try {
    const res = await api.post('/printers/action/receipt', payload);
    return { ok: true, via: 'api_tcp', data: res.data };
  } catch (err) {
    return { ok: false, error: err.response?.data?.message || err.message };
  }
}

/**
 * Auto-detect active thermal printers on the local LAN.
 */
export async function detectLocalPrinters() {
  const found = [];
  for (const ip of KNOWN_PRINTER_IPS) {
    try {
      const res = await pingPrinter(ip, 9100);
      if (res.ok) {
        found.push({ ip, port: 9100, via: res.via });
      }
    } catch (_) {}
  }
  return found;
}

export default {
  getRelayStatus,
  pingPrinter,
  printTestPage,
  sendOrderKOT,
  sendOrderReceipt,
  detectLocalPrinters,
};
