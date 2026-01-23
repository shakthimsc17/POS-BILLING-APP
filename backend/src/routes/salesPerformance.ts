import express from 'express';
import { query, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { parseTransactionItems } from '../utils/transactionParser.js';
import { getDayRangeLocal, getLocalHour } from '../utils/dateUtils.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get sales data for charts
router.get('/sales', [
  query('period').isIn(['7days', 'week', 'month', 'year', 'overall']).withMessage('Invalid period'),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.customerId!;
    const { period } = req.query;

    const now = new Date();
    let startDate: Date | null = null;

    switch (period) {
      case '7days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'overall':
        startDate = null;
        break;
    }

    const where: any = { customerId };
    if (startDate) {
      where.createdAt = { gte: startDate };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        totalAmount: true,
        createdAt: true,
        itemsJson: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day for 7days, week, month; by month for year; by year for overall
    const grouped: Record<string, { sales: number; profit: number; count: number }> = {};

    transactions.forEach((tx) => {
      const date = new Date(tx.createdAt);
      let key: string;

      if (period === '7days' || period === 'week') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } else if (period === 'year') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = String(date.getFullYear());
      }

      if (!grouped[key]) {
        grouped[key] = { sales: 0, profit: 0, count: 0 };
      }

      const amount = Number(tx.totalAmount);
      grouped[key].sales += amount;
      grouped[key].count += 1;

      // Calculate profit from items
      try {
        const { items } = parseTransactionItems(tx.itemsJson);
        items.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const quantity = cartItem.quantity || item.quantity || 1;
          
          let itemCost = 0;
          if (item.cost !== undefined) {
            itemCost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          }
          
          // Get price - use customPrice if available, otherwise use original price
          const originalPrice = cartItem.originalPrice !== undefined
            ? (typeof cartItem.originalPrice === 'string' ? parseFloat(cartItem.originalPrice) : cartItem.originalPrice)
            : (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0));
          const sellingPrice = cartItem.customPrice !== undefined
            ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
            : originalPrice;
          
          const profit = (sellingPrice - itemCost) * quantity;
          grouped[key].profit += profit;
        });
      } catch (e) {
        console.error('Error calculating profit for transaction:', e);
        // If itemsJson is invalid, skip profit calculation
      }
    });

    // Convert to array format for charts
    const chartData = Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        profit: data.profit,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(chartData);
  } catch (error: any) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch sales data' });
  }
});

// Get profit data
router.get('/profit', [
  query('period').isIn(['7days', 'week', 'month', 'year', 'overall']).withMessage('Invalid period'),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.customerId!;
    const { period } = req.query;

    const now = new Date();
    let startDate: Date | null = null;

    switch (period) {
      case '7days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'overall':
        startDate = null;
        break;
    }

    const where: any = { customerId };
    if (startDate) {
      where.createdAt = { gte: startDate };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        totalAmount: true,
        createdAt: true,
        itemsJson: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate total profit
    let totalProfit = 0;
    let totalSales = 0;
    let totalCost = 0;

    transactions.forEach((tx) => {
      const amount = Number(tx.totalAmount);
      totalSales += amount;

      try {
        const { items } = parseTransactionItems(tx.itemsJson);
        items.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const quantity = cartItem.quantity || item.quantity || 1;
          
          let itemCost = 0;
          if (item.cost !== undefined) {
            itemCost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
          }
          
          // Get price - use customPrice if available, otherwise use original price
          const originalPrice = cartItem.originalPrice !== undefined
            ? (typeof cartItem.originalPrice === 'string' ? parseFloat(cartItem.originalPrice) : cartItem.originalPrice)
            : (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0));
          const sellingPrice = cartItem.customPrice !== undefined
            ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
            : originalPrice;
          
          totalCost += itemCost * quantity;
          totalProfit += (sellingPrice - itemCost) * quantity;
        });
      } catch (e) {
        console.error('Error calculating profit for transaction:', e);
        // If itemsJson is invalid, skip
      }
    });

    res.json({
      total_profit: totalProfit,
      total_sales: totalSales,
      total_cost: totalCost,
      profit_margin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
    });
  } catch (error: any) {
    console.error('Error fetching profit data:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch profit data' });
  }
});

// Get top selling items
router.get('/top-items', [
  query('period').optional().isIn(['7days', 'week', 'month', 'year', 'overall']),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.customerId!;
    const period = (req.query.period as string) || 'overall';
    const limit = parseInt(req.query.limit as string) || 10;

    const now = new Date();
    let startDate: Date | null = null;

    switch (period) {
      case '7days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'overall':
        startDate = null;
        break;
    }

    const where: any = { customerId };
    if (startDate) {
      where.createdAt = { gte: startDate };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      select: { itemsJson: true },
    });

    const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    transactions.forEach((tx) => {
      try {
        const { items } = parseTransactionItems(tx.itemsJson);
        items.forEach((cartItem: any) => {
          const item = cartItem.item || cartItem;
          const quantity = cartItem.quantity || item.quantity || 1;
          
          // Get item ID - check multiple possible locations
          const itemId = item.id || item.item_id || cartItem.item_id || cartItem.id || item.name || 'unknown';
          
          // Get item name - check multiple possible locations
          const itemName = item.name || item.display_name || cartItem.name || cartItem.display_name || item.item?.name || 'Unknown';
          
          // Get price - use customPrice if available, otherwise use original price
          const originalPrice = cartItem.originalPrice !== undefined
            ? (typeof cartItem.originalPrice === 'string' ? parseFloat(cartItem.originalPrice) : cartItem.originalPrice)
            : (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0));
          const sellingPrice = cartItem.customPrice !== undefined
            ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
            : originalPrice;
          
          const revenue = sellingPrice * quantity;

          if (!itemMap[itemId]) {
            itemMap[itemId] = { name: itemName, quantity: 0, revenue: 0 };
          }
          itemMap[itemId].quantity += quantity;
          itemMap[itemId].revenue += revenue;
        });
      } catch (e) {
        console.error('Error parsing items for top items:', e);
        // Skip invalid itemsJson
      }
    });

    const topItems = Object.entries(itemMap)
      .map(([id, data]) => ({
        id,
        name: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);

    res.json(topItems);
  } catch (error: any) {
    console.error('Error fetching top items:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch top items' });
  }
});

// Get sales by payment method
router.get('/payment-methods', [
  query('period').optional().isIn(['7days', 'week', 'month', 'year', 'overall']),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.customerId!;
    const period = (req.query.period as string) || 'overall';

    const now = new Date();
    let startDate: Date | null = null;

    switch (period) {
      case '7days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'overall':
        startDate = null;
        break;
    }

    const where: any = { customerId };
    if (startDate) {
      where.createdAt = { gte: startDate };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      select: { totalAmount: true, paymentMethod: true },
    });

    const methodMap: Record<string, number> = {};

    transactions.forEach((tx) => {
      const method = tx.paymentMethod || 'unknown';
      const amount = Number(tx.totalAmount);
      methodMap[method] = (methodMap[method] || 0) + amount;
    });

    const paymentData = Object.entries(methodMap).map(([method, amount]) => ({
      method: method.toUpperCase(),
      amount,
    }));

    res.json(paymentData);
  } catch (error: any) {
    console.error('Error fetching payment methods data:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch payment methods data' });
  }
});

// Get hourly sales data - NEW CLEAN IMPLEMENTATION
router.get('/hourly', [
  query('date').notEmpty().withMessage('Date is required'),
  query('startHour').optional().isInt({ min: 0, max: 23 }),
  query('endHour').optional().isInt({ min: 0, max: 23 }),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.customerId!;
    const dateParam = req.query.date as string;
    const startHourNum = req.query.startHour ? parseInt(req.query.startHour as string) : 8;
    const endHourNum = req.query.endHour ? parseInt(req.query.endHour as string) : 22;

    // Use consistent date utility to get day range in local timezone
    const { start: dayStart, end: dayEnd } = getDayRangeLocal(dateParam);

    // Fetch all transactions for the entire day
    const transactions = await prisma.transaction.findMany({
      where: {
        customerId,
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: {
        totalAmount: true,
        createdAt: true,
        itemsJson: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Initialize hourly buckets
    const hourlyBuckets: Record<number, { sales: number; profit: number; count: number }> = {};
    for (let h = startHourNum; h <= endHourNum; h++) {
      hourlyBuckets[h] = { sales: 0, profit: 0, count: 0 };
    }

    // Process each transaction
    transactions.forEach((transaction) => {
      const txDate = new Date(transaction.createdAt);
      // Use local hour to match local timezone expectations
      const hour = getLocalHour(txDate);
      
      // Only process if hour is within range
      if (hour >= startHourNum && hour <= endHourNum) {
        const amount = Number(transaction.totalAmount) || 0;
        hourlyBuckets[hour].sales += amount;
        hourlyBuckets[hour].count += 1;

        // Calculate profit from items
        try {
          const { items } = parseTransactionItems(transaction.itemsJson);
          items.forEach((cartItem: any) => {
            const item = cartItem.item || cartItem;
            const quantity = cartItem.quantity || 1;
            
            // Get cost
            let itemCost = 0;
            if (item.cost !== undefined) {
              itemCost = typeof item.cost === 'string' ? parseFloat(item.cost) : (item.cost || 0);
            }
            
            // Get selling price - use customPrice if available, otherwise original price
            const originalPrice = cartItem.originalPrice !== undefined
              ? (typeof cartItem.originalPrice === 'string' ? parseFloat(cartItem.originalPrice) : cartItem.originalPrice)
              : (typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0));
            
            const sellingPrice = cartItem.customPrice !== undefined
              ? (typeof cartItem.customPrice === 'string' ? parseFloat(cartItem.customPrice) : cartItem.customPrice)
              : originalPrice;
            
            const profit = (sellingPrice - itemCost) * quantity;
            hourlyBuckets[hour].profit += profit;
          });
        } catch (error) {
          console.error('Error parsing transaction items:', error);
        }
      }
    });

    // Build response array with all hours in range
    const result = [];
    for (let h = startHourNum; h <= endHourNum; h++) {
      const data = hourlyBuckets[h];
      result.push({
        hour: h,
        hourLabel: `${String(h).padStart(2, '0')}:00`,
        sales: data.sales,
        profit: data.profit,
        count: data.count,
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching hourly sales data:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch hourly sales data' });
  }
});

export default router;

