import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma.js';
import { verifyToken } from '../utils/jwt.js';

export interface AuthRequest extends Request {
  customerId?: string;
  customer?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);
      req.customerId = decoded.customerId;

      // Optionally fetch customer data
      const customer = await prisma.customer.findUnique({
        where: { id: decoded.customerId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
          isAdmin: true,
          customerType: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!customer) {
        return res.status(401).json({ error: 'Customer not found' });
      }

      // Log admin account details for debugging
      if (customer.isAdmin) {
        console.log('Admin account authenticated:', {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          customerId: req.customerId,
        });
      }

      // Transform to snake_case for consistency
      req.customer = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        isAdmin: customer.isAdmin,
        customerType: customer.customerType || 'sales person',
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      };
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Middleware to require admin privileges
 * Must be used AFTER authenticate middleware
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.customer) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!req.customer.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

