const express = require('express');
const router  = express.Router();
const {
  handleWebhook,
  getSubscribers,
  addSubscriber,
  updateSubscriberPhone,
  removeSubscriber,
  getDailyReportPreview,
  sendManualDailyReport,
} = require('../controllers/telegramController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Telegram calls this — no auth needed
router.post('/webhook', handleWebhook);

// Admin / Dev management
router.get('/subscribers',                   protect, authorize('admin', 'dev'), getSubscribers);
router.post('/subscribers',                  protect, authorize('admin', 'dev'), addSubscriber);
router.put('/subscribers/:chatId/phone',     protect, authorize('admin', 'dev'), updateSubscriberPhone);
router.delete('/subscribers/:chatId',        protect, authorize('admin', 'dev'), removeSubscriber);

// Daily Sales Report Digest
router.get('/daily-report-preview',          protect, authorize('admin', 'dev'), getDailyReportPreview);
router.post('/send-daily-report',            protect, authorize('admin', 'dev'), sendManualDailyReport);

module.exports = router;
