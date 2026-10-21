const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, applyProductPriceAdjustment, updateDeveloperLicense } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSettings)
  .put(protect, authorize('admin', 'manager', 'dev'), updateSettings);

router.put('/developer-license', protect, updateDeveloperLicense);
router.post('/apply-product-price-adjustment', protect, authorize('admin', 'dev'), applyProductPriceAdjustment);

module.exports = router;
