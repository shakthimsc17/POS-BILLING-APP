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
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!customer) {
        return res.status(401).json({ error: 'Customer not found' });
      }

      req.customer = customer;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};
