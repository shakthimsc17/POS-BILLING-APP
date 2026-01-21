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
import companyRoutes from './routes/company.js';
import settingsRoutes from './routes/settings.js';
import itemCodePrefixesRoutes from './routes/itemCodePrefixes.js';
import activityLogsRoutes from './routes/activityLogs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow multiple origins for flexibility
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];
  
  // Add custom frontend URL if specified
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
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = getAllowedOrigins();
    
    if (allowedOrigins.includes(origin) || 
        origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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
app.use('/api/company', companyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/item-code-prefixes', itemCodePrefixesRoutes);
app.use('/api/activity-logs', activityLogsRoutes);

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
