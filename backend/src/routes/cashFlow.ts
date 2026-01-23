import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get cash flow entries with filters
router.get('/', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('type').optional().isIn(['income', 'expense']),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.customerId!;
    const { startDate, endDate, type } = req.query;

    const where: any = {
      customerId,
    };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) {
        where.entryDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.entryDate.lte = new Date(endDate as string);
      }
    }

    const entries = await prisma.cashFlowEntry.findMany({
      where,
      orderBy: { entryDate: 'desc' },
    });

    // Transform to snake_case for frontend
    const transformedEntries = entries.map(entry => ({
      id: entry.id,
      customer_id: entry.customerId,
      type: entry.type,
      category: entry.category,
      amount: entry.amount.toString(),
      description: entry.description,
      entry_date: entry.entryDate.toISOString(),
      created_at: entry.createdAt.toISOString(),
      updated_at: entry.updatedAt.toISOString(),
    }));

    res.json(transformedEntries);
  } catch (error: any) {
    console.error('Error fetching cash flow entries:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch cash flow entries' });
  }
});

// Get cash flow summary
router.get('/summary', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.customerId!;
    const { startDate, endDate } = req.query;

    // Filtered data (for income/expense cards)
    const where: any = {
      customerId,
    };

    const transactionWhere: any = {
      customerId,
    };

    if (startDate || endDate) {
      where.entryDate = {};
      transactionWhere.createdAt = {};
      if (startDate) {
        where.entryDate.gte = new Date(startDate as string);
        transactionWhere.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.entryDate.lte = new Date(endDate as string);
        transactionWhere.createdAt.lte = new Date(endDate as string);
      }
    }

    // All-time data (for net cash flow calculation)
    const allTimeWhere: any = { customerId };
    const allTimeTransactionWhere: any = { customerId };

    const [
      incomeEntries,
      expenseEntries,
      transactions,
      allTimeIncomeEntries,
      allTimeExpenseEntries,
      allTimeTransactions,
      stockInvestmentData,
    ] = await Promise.all([
      // Filtered data
      prisma.cashFlowEntry.findMany({
        where: { ...where, type: 'income' },
        select: { amount: true },
      }),
      prisma.cashFlowEntry.findMany({
        where: { ...where, type: 'expense' },
        select: { amount: true },
      }),
      prisma.transaction.findMany({
        where: transactionWhere,
        select: { totalAmount: true, createdAt: true, itemsJson: true },
      }),
      // All-time data
      prisma.cashFlowEntry.findMany({
        where: { ...allTimeWhere, type: 'income' },
        select: { amount: true },
      }),
      prisma.cashFlowEntry.findMany({
        where: { ...allTimeWhere, type: 'expense' },
        select: { amount: true },
      }),
      prisma.transaction.findMany({
        where: allTimeTransactionWhere,
        select: { totalAmount: true, createdAt: true },
      }),
      // Stock investment
      prisma.item.findMany({
        where: { customerId },
        select: { cost: true, stock: true },
      }),
    ]);

    // Filtered totals (for income/expense cards)
    const manualIncome = incomeEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const totalSales = transactions.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
    const totalIncome = manualIncome + totalSales;
    const totalExpense = expenseEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
    
    // Calculate profit from transactions for filtered date range
    let totalProfit = 0;
    transactions.forEach((tx) => {
      try {
        const items = JSON.parse(tx.itemsJson);
        items.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const quantity = cartItem.quantity || item.quantity || 1;
          
          let itemCost = 0;
          let itemPrice = 0;
          
          if (item.cost !== undefined) {
            itemCost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          }
          
          if (cartItem.customPrice !== undefined) {
            itemPrice = typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : (cartItem.customPrice || 0);
          } else if (item.price !== undefined) {
            itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
          } else if (cartItem.originalPrice !== undefined) {
            itemPrice = typeof cartItem.originalPrice === 'string' ? parseFloat(cartItem.originalPrice) : (cartItem.originalPrice || 0);
          }
          
          totalProfit += (itemPrice - itemCost) * quantity;
        });
      } catch (e) {
        // Skip if itemsJson is invalid
      }
    });

    // All-time totals (for net cash flow)
    const allTimeManualIncome = allTimeIncomeEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const allTimeTotalSales = allTimeTransactions.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
    const allTimeTotalExpense = allTimeExpenseEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const stockInvestment = stockInvestmentData.reduce((sum, item) => sum + (Number(item.cost) * item.stock), 0);

    // Net Cash Flow = (All-time Sales + All-time Manual Income) - (All-time Expenses + Stock Investment)
    const netCashFlow = (allTimeTotalSales + allTimeManualIncome) - (allTimeTotalExpense + stockInvestment);

    res.json({
      total_income: totalIncome,
      total_sales: totalSales,
      manual_income: manualIncome,
      total_expense: totalExpense,
      total_profit: totalProfit, // Profit from transactions for filtered date range
      net_cash_flow: netCashFlow,
      // Include all-time data for reference
      all_time_sales: allTimeTotalSales,
      all_time_manual_income: allTimeManualIncome,
      all_time_expense: allTimeTotalExpense,
      stock_investment: stockInvestment,
    });
  } catch (error: any) {
    console.error('Error fetching cash flow summary:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch cash flow summary' });
  }
});

// Get stock investment total
router.get('/stock-investment', async (req: AuthRequest, res) => {
  try {
    const customerId = req.customerId!;

    const items = await prisma.item.findMany({
      where: { customerId },
      select: { cost: true, stock: true },
    });

    const totalInvestment = items.reduce((sum, item) => {
      return sum + (Number(item.cost) * item.stock);
    }, 0);

    res.json({ total_investment: totalInvestment });
  } catch (error: any) {
    console.error('Error calculating stock investment:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate stock investment' });
  }
});

// Get categories
router.get('/categories', async (req: AuthRequest, res) => {
  try {
    // Categories are defined in frontend types, but we can return them from backend too
    res.json({
      income: [
        { name: 'Profit', icon: '💰', type: 'income' },
        { name: 'Salary', icon: '💵', type: 'income' },
        { name: 'Awards', icon: '🏆', type: 'income' },
        { name: 'Rental', icon: '🏠', type: 'income' },
        { name: 'Sale', icon: '🛒', type: 'income' },
        { name: 'Refund', icon: '↩️', type: 'income' },
        { name: 'Lottery', icon: '🎰', type: 'income' },
        { name: 'Dividend', icon: '📈', type: 'income' },
        { name: 'Investment', icon: '💼', type: 'income' },
        { name: 'Interest', icon: '💳', type: 'income' },
        { name: 'Commission', icon: '🤝', type: 'income' },
        { name: 'Fee', icon: '💸', type: 'income' },
        { name: 'Loan', icon: '🏦', type: 'income' },
        { name: 'Miscellaneous', icon: '📦', type: 'income' },
        { name: 'Custom', icon: '➕', type: 'income' }
      ],
      expense: [
        { name: 'Tax', icon: '📋', type: 'expense' },
        { name: 'Fuel', icon: '⛽', type: 'expense' },
        { name: 'Food', icon: '🍔', type: 'expense' },
        { name: 'Bill', icon: '📄', type: 'expense' },
        { name: 'Transportation', icon: '🚗', type: 'expense' },
        { name: 'Insurance', icon: '🛡️', type: 'expense' },
        { name: 'Salary', icon: '👔', type: 'expense' },
        { name: 'Rent', icon: '🏢', type: 'expense' },
        { name: 'Repairs', icon: '🔧', type: 'expense' },
        { name: 'Commissions', icon: '💼', type: 'expense' },
        { name: 'Advertising', icon: '📢', type: 'expense' },
        { name: 'Fee', icon: '💳', type: 'expense' },
        { name: 'Interest', icon: '📊', type: 'expense' },
        { name: 'Loan', icon: '🏦', type: 'expense' },
        { name: 'Supplies', icon: '📦', type: 'expense' },
        { name: 'Transfer', icon: '💸', type: 'expense' },
        { name: 'Contract', icon: '📝', type: 'expense' },
        { name: 'Miscellaneous', icon: '📋', type: 'expense' },
        { name: 'Stock Investment', icon: '📊', type: 'expense' },
        { name: 'Employee Salary', icon: '👥', type: 'expense' },
        { name: 'Daily Expenses', icon: '☕', type: 'expense' },
        { name: 'Custom', icon: '➕', type: 'expense' }
      ]
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch categories' });
  }
});

// Create cash flow entry
router.post('/', [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('entry_date').isISO8601().withMessage('Entry date must be a valid date'),
  body('description').optional().isString(),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.customerId!;
    const { type, category, amount, description, entry_date } = req.body;

    const entry = await prisma.cashFlowEntry.create({
      data: {
        customerId,
        type,
        category,
        amount: parseFloat(amount),
        description: description || null,
        entryDate: new Date(entry_date),
      },
    });

    // Transform to snake_case for frontend
    res.status(201).json({
      id: entry.id,
      customer_id: entry.customerId,
      type: entry.type,
      category: entry.category,
      amount: entry.amount.toString(),
      description: entry.description,
      entry_date: entry.entryDate.toISOString(),
      created_at: entry.createdAt.toISOString(),
      updated_at: entry.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error creating cash flow entry:', error);
    res.status(500).json({ error: error.message || 'Failed to create cash flow entry' });
  }
});

// Update cash flow entry
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid entry ID'),
  body('type').optional().isIn(['income', 'expense']),
  body('category').optional().notEmpty(),
  body('amount').optional().isFloat({ min: 0 }),
  body('entry_date').optional().isISO8601(),
  body('description').optional().isString(),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.customerId!;
    const { id } = req.params;
    const { type, category, amount, description, entry_date } = req.body;

    // Check if entry exists and belongs to customer
    const existingEntry = await prisma.cashFlowEntry.findFirst({
      where: { id, customerId },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Cash flow entry not found' });
    }

    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description || null;
    if (entry_date !== undefined) updateData.entryDate = new Date(entry_date);

    const entry = await prisma.cashFlowEntry.update({
      where: { id },
      data: updateData,
    });

    // Transform to snake_case for frontend
    res.json({
      id: entry.id,
      customer_id: entry.customerId,
      type: entry.type,
      category: entry.category,
      amount: entry.amount.toString(),
      description: entry.description,
      entry_date: entry.entryDate.toISOString(),
      created_at: entry.createdAt.toISOString(),
      updated_at: entry.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating cash flow entry:', error);
    res.status(500).json({ error: error.message || 'Failed to update cash flow entry' });
  }
});

// Delete cash flow entry
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid entry ID'),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.customerId!;
    const { id } = req.params;

    // Check if entry exists and belongs to customer
    const existingEntry = await prisma.cashFlowEntry.findFirst({
      where: { id, customerId },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Cash flow entry not found' });
    }

    await prisma.cashFlowEntry.delete({
      where: { id },
    });

    res.json({ message: 'Cash flow entry deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting cash flow entry:', error);
    res.status(500).json({ error: error.message || 'Failed to delete cash flow entry' });
  }
});

export default router;

