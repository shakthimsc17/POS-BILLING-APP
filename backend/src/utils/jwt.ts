import jwt from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  return secret;
};

export const generateToken = (customerId: string): string => {
  return jwt.sign({ customerId }, getJwtSecret(), {
    expiresIn: '30d',
  });
};

export const verifyToken = (token: string): { customerId: string } => {
  try {
    return jwt.verify(token, getJwtSecret()) as { customerId: string };
  } catch (error) {
    throw new Error('Invalid token');
  }
};

