const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'Utilities (Power, Water, Gas)',
  'Rent & Facility',
  'Cleaning & Sanitation (Soap, Detergents)',
  'Maintenance, Electrical & Repairs (Bulbs, Wiring)',
  'Small Tools & Equipment',
  'Kitchen & Dining Supplies (Non-stock)',
  'Transportation & Logistics',
  'Communication & Internet',
  'Wages & Daily Casual Labor',
  'Marketing, Printing & Signage',
  'Government, Taxes & Licenses',
  'Miscellaneous Overhead',
];

const PAYMENT_METHODS = [
  'Cash',
  'Telebirr',
  'Bank Transfer / CBE',
  'Credit / Payable',
  'Check',
  'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title or description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      default: 'Utilities (Power, Water, Gas)',
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'ETB',
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      default: 'Cash',
      trim: true,
    },
    paidTo: {
      type: String,
      trim: true,
      default: '',
    },
    referenceNo: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Paid',
    },
    // Soft-delete support
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedFrom: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ isActive: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
