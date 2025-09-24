import jwt, { SignOptions } from 'jsonwebtoken';

export class JWTService {
  readonly secret: string;
  readonly expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-secret-key';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7';
  }

  generateToken(payload: string | object | Buffer): string {
    const options: SignOptions = {
      expiresIn: Number(this.expiresIn)
    };
    
    return jwt.sign(payload, this.secret, options);
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}

export const jwtService = new JWTService();