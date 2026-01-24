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

// CORS configuration - environment-based
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];
  
  // Production: Use ALLOWED_ORIGINS environment variable
  if (process.env.NODE_ENV === 'production') {
    if (process.env.ALLOWED_ORIGINS) {
      return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    }
    // Fallback: Use FRONTEND_URL if ALLOWED_ORIGINS not set
    if (process.env.FRONTEND_URL) {
      return [process.env.FRONTEND_URL];
    }
    // Production should have explicit origins configured
    console.warn('⚠️  WARNING: No ALLOWED_ORIGINS configured for production');
    return [];
  }
  
  // Development: Allow localhost and custom frontend URL
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  // Add common localhost ports for development
  const commonPorts = ['3000', '5173', '5174', '5175', '8080'];
  commonPorts.forEach(port => {
    origins.push(`http://localhost:${port}`);
  });
  
  return origins;
};

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) in development only
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('CORS: Origin required in production'));
      }
      return callback(null, true);
    }
    
    const allowedOrigins = getAllowedOrigins();
    
    // In development, allow localhost origins
    if (process.env.NODE_ENV !== 'production') {
    if (allowedOrigins.includes(origin) || 
        origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    } else {
      // In production, only allow explicitly configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
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
  console.log(`📡 CORS enabled for localhost ports: 3000, 5173, 5174, 5175, 8080`);
  if (process.env.FRONTEND_URL) {
    console.log(`📡 Custom frontend URL: ${process.env.FRONTEND_URL}`);
  }
});
