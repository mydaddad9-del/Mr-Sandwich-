const express = require("express");
const router = express.Router();
const { protect, verifyModuleLicense } = require("../middleware/authMiddleware");
const {
  createCaptainOrder,
  getCaptainOrders,
  getCaptainOrderById,
  updateCaptainOrder,
  sendToKitchen,
  voidCaptainOrder,
  approveCustomerOrder,
  rejectCustomerOrder,
  getActiveTables,
} = require("../controllers/captainOrderController");

router.use(protect);
router.use(verifyModuleLicense('subsystem'));

router.get("/active-tables", getActiveTables);
router.route("/").get(getCaptainOrders).post(createCaptainOrder);
router.route("/:id").get(getCaptainOrderById).patch(updateCaptainOrder);
router.post("/:id/approve", approveCustomerOrder);
router.post("/:id/approve-order", approveCustomerOrder);
router.post("/:id/decline", rejectCustomerOrder);
router.post("/:id/reject-order", rejectCustomerOrder);
router.post("/:id/send-to-kitchen", sendToKitchen);
router.post("/:id/void", voidCaptainOrder);

module.exports = router;
