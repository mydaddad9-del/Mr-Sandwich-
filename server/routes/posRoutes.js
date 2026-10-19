const express = require('express');
const router = express.Router();
const { protect, authorize, verifyModuleLicense } = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  voidOrder,
  reprintOrder,
  getPOSSummary,
} = require('../controllers/posController');

router.use(protect);
router.use(verifyModuleLicense('subsystem'));

router.route('/orders')
  .post(createOrder)
  .get(getOrders);

router.get('/summary', getPOSSummary);

router.route('/orders/:id')
  .get(getOrderById);

router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/void', authorize('admin', 'manager'), voidOrder);
router.post('/orders/:id/reprint', reprintOrder);

module.exports = router;
