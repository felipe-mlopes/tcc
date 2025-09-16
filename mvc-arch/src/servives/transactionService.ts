import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

export class TransactionService {
  static async createBuyTransaction(investorId: string, data: {
    assetId: string;
    quantity: number;
    price: number;
    fees?: number;
    dateAt: string;
  }) {
    // Pega o primeiro portfolio do investidor
    const portfolio = await prisma.portfolio.findFirst({
      where: { investorId },
      orderBy: { createdAt: 'asc' },
    });

    if (!portfolio) {
      throw new Error('Nenhum portfólio encontrado para o investidor');
    }

    const transaction = await prisma.transaction.create({
      data: {
        portfolioId: portfolio.id,
        assetId: data.assetId,
        type: TransactionType.Buy,
        quantity: data.quantity,
        price: data.price,
        fees: data.fees || 0,
        dateAt: new Date(data.dateAt),
      },
      include: {
        asset: true,
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return transaction;
  }

  static async createSellTransaction(investorId: string, data: {
    assetId: string;
    quantity: number;
    price: number;
    fees?: number;
    dateAt: string;
  }) {
    // Pega o primeiro portfolio do investidor
    const portfolio = await prisma.portfolio.findFirst({
      where: { investorId },
      orderBy: { createdAt: 'asc' },
    });

    if (!portfolio) {
      throw new Error('Nenhum portfólio encontrado para o investidor');
    }

    // Verifica se há quantidade suficiente para vender
    const investment = await prisma.investment.findUnique({
      where: {
        portfolioId_assetId: {
          portfolioId: portfolio.id,
          assetId: data.assetId,
        },
      },
    });

    if (!investment || investment.quantity.lt(data.quantity)) {
      throw new Error('Quantidade insuficiente para venda');
    }

    const transaction = await prisma.transaction.create({
      data: {
        portfolioId: portfolio.id,
        assetId: data.assetId,
        type: TransactionType.Sell,
        quantity: data.quantity,
        price: data.price,
        fees: data.fees || 0,
        dateAt: new Date(data.dateAt),
      },
      include: {
        asset: true,
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return transaction;
  }

  static async createDividendTransaction(investorId: string, data: {
    assetId: string;
    quantity: number;
    price: number;
    income: number;
    dateAt: string;
  }) {
    // Pega o primeiro portfolio do investidor
    const portfolio = await prisma.portfolio.findFirst({
      where: { investorId },
      orderBy: { createdAt: 'asc' },
    });

    if (!portfolio) {
      throw new Error('Nenhum portfólio encontrado para o investidor');
    }

    const transaction = await prisma.transaction.create({
      data: {
        portfolioId: portfolio.id,
        assetId: data.assetId,
        type: TransactionType.Dividend,
        quantity: data.quantity,
        price: data.price,
        income: data.income,
        dateAt: new Date(data.dateAt),
      },
      include: {
        asset: true,
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return transaction;
  }

  static async updateTransaction(investorId: string, transactionId: string, data: {
    type?: TransactionType;
    quantity?: number;
    price?: number;
    fees?: number;
  }) {
    // Verifica se a transação pertence ao investidor
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        portfolio: {
          investorId,
        },
      },
    });

    if (!existingTransaction) {
      throw new Error('Transação não encontrada');
    }

    const updateData: any = {};
    if (data.type) updateData.type = data.type;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.fees !== undefined) updateData.fees = data.fees;

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
      include: {
        asset: true,
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return transaction;
  }

  static async getTransactionsByAsset(investorId: string, assetId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          assetId,
          portfolio: {
            investorId,
          },
        },
        include: {
          asset: true,
          portfolio: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { dateAt: 'desc' },
      }),
      prisma.transaction.count({
        where: {
          assetId,
          portfolio: {
            investorId,
          },
        },
      }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTransactionsByPortfolio(investorId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          portfolio: {
            investorId,
          },
        },
        include: {
          asset: true,
          portfolio: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { dateAt: 'desc' },
      }),
      prisma.transaction.count({
        where: {
          portfolio: {
            investorId,
          },
        },
      }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTransactionById(investorId: string, transactionId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        portfolio: {
          investorId,
        },
      },
      include: {
        asset: true,
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return transaction;
  }

  static async getTransactionSummary(investorId: string, assetId?: string) {
    const whereClause: any = {
      portfolio: {
        investorId,
      },
    };

    if (assetId) {
      whereClause.assetId = assetId;
    }

    const summary = await prisma.transaction.groupBy({
      by: ['type'],
      where: whereClause,
      _count: {
        id: true,
      },
      _sum: {
        quantity: true,
        price: true,
        fees: true,
        income: true,
      },
    });

    return summary;
  }
}