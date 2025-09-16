import jwt from 'jsonwebtoken';

export interface JWTPayload {
  investorId: string;
  email: string;
}

export class JWTUtil {
  private static secret = process.env.JWT_SECRET || 'fallback-secret';
  private static expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, this.secret) as JWTPayload;
  }
}