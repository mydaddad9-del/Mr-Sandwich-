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
} = require('../controllers/printerController');

// CRUD
router.route('/').get(protect, getPrinters).post(protect, createPrinter);
router.route('/:id').get(protect, getPrinter).put(protect, updatePrinter).delete(protect, deletePrinter);

// Utility
router.post('/action/ping',      protect, pingPrinter);
router.post('/action/test-page', protect, printTestPageEndpoint);
router.post('/action/kot',       protect, printKOTEndpoint);
router.post('/action/receipt',   protect, printReceiptEndpoint);

module.exports = router;
