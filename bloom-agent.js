/**
 * bloom-agent.js – Bloom Bar & Restaurant Cloud Print Agent
 *
 * Runs on the local POS computer (RED-RMS) on the restaurant LAN.
 * Connects outbound to the cloud server and relays print jobs to
 * thermal printers over raw TCP (192.168.8.222:9100).
 *
 * Requirements: Node.js (pure built-in modules, zero npm dependencies).
 */

const http = require('http');
const https = require('https');
const net = require('net');
const fs = require('fs');
const path = require('path');

// Configuration file
const CONFIG_FILE = path.join(__dirname, 'agent-config.json');

let config = {
  cloudUrl: 'https://five-stop.app.aletcloud.com',
  defaultPrinterIp: '192.168.8.222',
  defaultPrinterPort: 9100,
};

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    config = { ...config, ...saved };
  } catch (_) {}
}

const isHttps = config.cloudUrl.startsWith('https://');
const client = isHttps ? https : http;

console.log('========================================================');
console.log('  Bloom Bar & Restaurant - Cloud Print Agent');
console.log('========================================================');
console.log(`[CONFIG] Cloud Server: ${config.cloudUrl}`);
console.log(`[CONFIG] Default Printer: ${config.defaultPrinterIp}:${config.defaultPrinterPort}`);
console.log('');

// Test printer connection on startup
function checkLocalPrinter(ip = config.defaultPrinterIp, port = config.defaultPrinterPort) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(2500);
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

function sendRawToPrinter(ip, port, data) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (err) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve({ ok: true });
    };

    const timer = setTimeout(() => done(new Error(`Timeout connecting to ${ip}:${port}`)), 4000);

    socket.connect(port, ip, () => {
      clearTimeout(timer);
      socket.write(data, (err) => {
        if (err) done(err);
        else setTimeout(() => done(null), 300);
      });
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      done(err);
    });
  });
}

// Build ESC/POS bytes for test page
function buildTestReceipt(hotelName = 'Bloom Bar & Restaurant', footer = 'Print Test Successful!') {
  const ESC = 0x1b;
  const GS = 0x1d;
  const INIT = Buffer.from([ESC, 0x40]);
  const ALIGN_CENTER = Buffer.from([ESC, 0x61, 0x01]);
  const ALIGN_LEFT = Buffer.from([ESC, 0x61, 0x00]);
  const BOLD_ON = Buffer.from([ESC, 0x45, 0x01]);
  const BOLD_OFF = Buffer.from([ESC, 0x45, 0x00]);
  const DBL_ON = Buffer.from([ESC, 0x21, 0x30]);
  const DBL_OFF = Buffer.from([ESC, 0x21, 0x00]);
  const CUT = Buffer.from([GS, 0x56, 0x00]);
  const LF = Buffer.from('\n', 'latin1');

  const text = (str) => Buffer.from(str + '\n', 'latin1');

  return Buffer.concat([
    INIT,
    ALIGN_CENTER,
    DBL_ON,
    text(hotelName.toUpperCase()),
    DBL_OFF,
    BOLD_ON,
    text('TCP DIRECT PRINT TEST'),
    BOLD_OFF,
    text('--------------------------------'),
    ALIGN_LEFT,
    text('Date: ' + new Date().toLocaleString('en-ET')),
    text('Printer: 192.168.8.222:9100'),
    text('Paper: 60x80mm ESC/POS'),
    text('Status: ONLINE & VERIFIED [OK]'),
    text('--------------------------------'),
    ALIGN_CENTER,
    BOLD_ON,
    text(footer),
    BOLD_OFF,
    Buffer.from([ESC, 0x64, 4]), // feed 4 lines
    CUT,
  ]);
}

// Complete job back to cloud server
function completeJob(jobId, result) {
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
    },
  });
  req.on('error', (e) => console.error('[AGENT] Complete error:', e.message));
  req.write(postData);
  req.end();
}

// Long-polling loop
async function pollLoop() {
  const parsed = new URL(config.cloudUrl);

  const req = client.request({
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port || (isHttps ? 443 : 80),
    path: '/api/printers/relay/poll',
    method: 'GET',
    headers: { 'User-Agent': 'BloomPrintAgent/1.0' },
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const jobs = data.jobs || [];

        for (const job of jobs) {
          console.log(`[JOB] Received ${job.action} (id: ${job.id})`);
          if (job.action === 'ping') {
            const ok = await checkLocalPrinter(job.payload?.ip || config.defaultPrinterIp, job.payload?.port || 9100);
            console.log(`[PING] Tested ${job.payload?.ip}:${job.payload?.port} -> ${ok ? 'ONLINE [OK]' : 'OFFLINE'}`);
            completeJob(job.id, { ok });
          } else if (job.action === 'test_page') {
            const ip = job.payload?.printer?.ipAddress || config.defaultPrinterIp;
            const port = job.payload?.printer?.port || 9100;
            const rawBytes = buildTestReceipt('Bloom Bar & Restaurant', 'TCP Cloud Print Passed');
            try {
              await sendRawToPrinter(ip, port, rawBytes);
              console.log(`[PRINT] Test page printed to ${ip}:${port} [SUCCESS]`);
              completeJob(job.id, { ok: true, message: `Printed to ${ip}:${port}` });
            } catch (err) {
              console.error(`[PRINT] Error printing to ${ip}:${port}:`, err.message);
              completeJob(job.id, { ok: false, error: err.message });
            }
          }
        }
      } catch (_) {}

      // Continue polling immediately
      setImmediate(pollLoop);
    });
  });

  req.on('error', (err) => {
    console.log(`[AGENT] Cloud connect retry in 3s... (${err.message})`);
    setTimeout(pollLoop, 3000);
  });

  req.end();
}

// Start agent
(async () => {
  console.log(`[LAN] Checking local printer at ${config.defaultPrinterIp}:${config.defaultPrinterPort}...`);
  const isOnline = await checkLocalPrinter();
  if (isOnline) {
    console.log(`[LAN] ✓ Printer ${config.defaultPrinterIp}:${config.defaultPrinterPort} is ONLINE & READY!`);
  } else {
    console.log(`[LAN] ⚠ Printer ${config.defaultPrinterIp}:${config.defaultPrinterPort} not responding. Check power & IP.`);
  }

  console.log(`[CLOUD] Connecting to Cloud Relay at ${config.cloudUrl}...`);
  pollLoop();
  console.log(`[AGENT] ✓ Print agent is active and listening for orders.`);
})();
