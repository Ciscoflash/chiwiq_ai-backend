import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chiwiq_super_secret_key';

export const signToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): jwt.JwtPayload | string => {
  return jwt.verify(token, JWT_SECRET);
};