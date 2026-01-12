import jwt from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
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

