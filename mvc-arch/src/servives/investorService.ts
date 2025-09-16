import { PrismaClient } from '@prisma/client';
import { EncryptionUtil } from '../utils/encryption';
import { JWTUtil } from '../utils/jwt';

const prisma = new PrismaClient();

export class InvestorService {
  static async createInvestor(data: {
    email: string;
    name: string;
    cpf: string;
    dateOfBirth: string;
    password: string;
  }) {
    const hashedPassword = await EncryptionUtil.hashPassword(data.password);
    
    const investor = await prisma.investor.create({
      data: {
        ...data,
        cpf: data.cpf.replace(/[^\d]/g, ''),
        dateOfBirth: new Date(data.dateOfBirth),
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        dateOfBirth: true,
        profile: true,
        createdAt: true,
      },
    });

    return investor;
  }

  static async authenticateInvestor(email: string, password: string) {
    const investor = await prisma.investor.findUnique({
      where: { 
        email,
        isActive: true 
      },
    });

    if (!investor) {
      throw new Error('Credenciais inválidas');
    }

    const isValidPassword = await EncryptionUtil.comparePassword(password, investor.password);
    
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    const token = JWTUtil.generateToken({
      investorId: investor.id,
      email: investor.email,
    });

    return {
      investor: {
        id: investor.id,
        email: investor.email,
        name: investor.name,
        profile: investor.profile,
      },
      accessToken: token,
    };
  }

  static async updateInvestor(investorId: string, data: {
    email?: string;
    name?: string;
    password?: string;
  }) {
    const updateData: any = {};

    if (data.email) updateData.email = data.email;
    if (data.name) updateData.name = data.name;
    if (data.password) {
      updateData.password = await EncryptionUtil.hashPassword(data.password);
    }

    const investor = await prisma.investor.update({
      where: { id: investorId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        dateOfBirth: true,
        profile: true,
        updatedAt: true,
      },
    });

    return investor;
  }

  static async deactivateInvestor(investorId: string) {
    await prisma.investor.update({
      where: { id: investorId },
      data: { isActive: false },
    });

    return { message: 'Investidor desativado com sucesso' };
  }

  static async getInvestorById(investorId: string) {
    const investor = await prisma.investor.findUnique({
      where: { 
        id: investorId,
        isActive: true 
      },
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        dateOfBirth: true,
        profile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return investor;
  }
}