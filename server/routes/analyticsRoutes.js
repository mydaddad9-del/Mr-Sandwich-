const express = require('express');
const router  = express.Router();
const {
  getProfitLoss,
  getConsumption,
  getPrediction,
  getSalesRecords,
  deleteSalesRecord,
} = require('../controllers/analyticsController');
const { protect, authorizePermission, verifyModuleLicense } = require('../middleware/authMiddleware');

router.use(protect);
router.use(verifyModuleLicense('finance'));
router.use(authorizePermission('viewReports'));

router.get('/pl',               getProfitLoss);
router.get('/consumption',      getConsumption);
router.get('/prediction',       getPrediction);
router.get('/records',          getSalesRecords);
router.delete('/records/:id',   deleteSalesRecord);

module.exports = router;
