import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import itemsRoutes from './routes/items.js';
import transactionsRoutes from './routes/transactions.js';
import customersRoutes from './routes/customers.js';
import salesCustomersRoutes from './routes/salesCustomers.js';
import quickSaleItemsRoutes from './routes/quickSaleItems.js';
import cashFlowRoutes from './routes/cashFlow.js';
import salesPerformanceRoutes from './routes/salesPerformance.js';
import companyRoutes from './routes/company.js';
import settingsRoutes from './routes/settings.js';
import itemCodePrefixesRoutes from './routes/itemCodePrefixes.js';
import activityLogsRoutes from './routes/activityLogs.js';
import permissionsRoutes from './routes/permissions.js';
import cartsRoutes from './routes/carts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - simplified
const getAllowedOrigins = (): string[] => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || 
           (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []);
  }
  // Development: Allow localhost and custom frontend URL
  const devOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:8080'];
  if (process.env.FRONTEND_URL) {
    devOrigins.push(process.env.FRONTEND_URL);
  }
  return devOrigins;
};

// Middleware - CORS must be before routes
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman) in development only
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('CORS: Origin required in production'));
      }
      return callback(null, true);
    }
    
    const allowedOrigins = getAllowedOrigins();
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, also allow any localhost origin
    if (process.env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Increase body size limit to handle base64 images (50MB should be enough)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/sales-customers', salesCustomersRoutes);
app.use('/api/quick-sale-items', quickSaleItemsRoutes);
app.use('/api/cash-flow', cashFlowRoutes);
app.use('/api/sales-performance', salesPerformanceRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/item-code-prefixes', itemCodePrefixesRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/carts', cartsRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 CORS enabled for localhost ports: 3000 (default), 5173, 5174, 5175, 8080`);
  if (process.env.FRONTEND_URL) {
    console.log(`📡 Custom frontend URL: ${process.env.FRONTEND_URL}`);
  }
});
