const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/printerController');

// Allow loopback local print bridge (127.0.0.1) or authenticated users
const localOrProtect = (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || '';
  const isLoopback = ip.includes('127.0.0.1') || ip.includes('::1') || ip === 'localhost';
  if (isLoopback) return next();
  return protect(req, res, next);
};

// Cloud Print Relay (communicates with local POS machine agent)
router.get('/relay/poll',      relayPollEndpoint);
router.post('/relay/complete', relayCompleteEndpoint);
router.get('/relay/status',    relayStatusEndpoint);

// CRUD
router.route('/').get(protect, getPrinters).post(protect, createPrinter);
router.route('/:id').get(protect, getPrinter).put(protect, updatePrinter).delete(protect, deletePrinter);

// Utility
router.post('/action/ping',      localOrProtect, pingPrinter);
router.post('/action/test-page', localOrProtect, printTestPageEndpoint);
router.post('/action/kot',       localOrProtect, printKOTEndpoint);
router.post('/action/receipt',   localOrProtect, printReceiptEndpoint);

module.exports = router;
