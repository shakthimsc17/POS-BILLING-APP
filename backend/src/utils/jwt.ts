import jwt from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  // Validate JWT secret strength (minimum 32 characters for production)
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for production');
  }
  
  if (secret.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters long');
  }
  
  return secret;
};

export const generateToken = (customerId: string, isAdmin: boolean = false): string => {
  return jwt.sign({ customerId, isAdmin }, getJwtSecret(), {
    expiresIn: '30d',
  });
};

export const verifyToken = (token: string): { customerId: string; isAdmin?: boolean } => {
  try {
    return jwt.verify(token, getJwtSecret()) as { customerId: string; isAdmin?: boolean };
  } catch (error) {
    throw new Error('Invalid token');
  }
};

