import { Request, Response, NextFunction } from 'express';
import { JWTUtil } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  investor?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    const token = authHeader.substring(7);
    const decoded = JWTUtil.verifyToken(token);

    req.investor = {
      id: decoded.investorId,
      email: decoded.email
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};