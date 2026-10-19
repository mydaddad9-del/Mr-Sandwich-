const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getExpenseStats,
  getExpenseMeta,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/meta', getExpenseMeta);
router.get('/stats', getExpenseStats);
router.get('/', getExpenses);
router.get('/:id', getExpenseById);

router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', authorize('admin', 'manager'), deleteExpense);

module.exports = router;
