import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class PortfolioService {

  /**
   * Cria um novo portfólio para um investidor.
   * @param investorId O ID do investidor.
   * @param data Dados do portfólio (nome, descrição).
   * @returns O portfólio criado com as informações do investidor.
   */
  static async createPortfolio(investorId: string, data: {
    name: string;
    description?: string;
  }) {
    const portfolio = await prisma.portfolio.create({
      data: {
        name: data.name,
        description: data.description,
        investorId,
      },
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return portfolio;
  }

  /**
   * Adiciona um novo investimento ou atualiza um existente em um portfólio.
   * @param investorId O ID do investidor.
   * @param data Dados do investimento.
   * @returns O investimento criado ou atualizado.
   */
  static async addInvestment(investorId: string, data: {
    portfolioId?: string;
    assetId: string;
    quantity: number;
    currentPrice: number;
  }) {
    // Se não foi informado o portfolioId, pega o primeiro portfólio do investidor
    let portfolioId = data.portfolioId;

    if (!portfolioId) {
      const defaultPortfolio = await prisma.portfolio.findFirst({
        where: { investorId },
        orderBy: { createdAt: 'asc' },
      });
      if (!defaultPortfolio) {
        throw new Error('Nenhum portfólio encontrado para o investidor');
      }
      portfolioId = defaultPortfolio.id;
    }

    // Verifica se o portfólio pertence ao investidor
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
    });
    if (!portfolio || portfolio.investorId !== investorId) {
      throw new Error('Portfólio não encontrado ou não pertence ao investidor');
    }

    // Verifica se já existe investimento nesse ativo no portfólio
    const existingInvestment = await prisma.investment.findUnique({
      where: {
        portfolioId_assetId: {
          portfolioId,
          assetId: data.assetId,
        },
      },
    });

    if (existingInvestment) {
      // Atualiza investimento existente
      const newQuantity = existingInvestment.quantity.add(data.quantity);
      const totalValue = existingInvestment.totalValue.add(
        new Prisma.Decimal(data.quantity).mul(new Prisma.Decimal(data.currentPrice))
      );
      const newAveragePrice = totalValue.div(newQuantity);

      const updatedInvestment = await prisma.investment.update({
        where: { id: existingInvestment.id },
        data: {
          quantity: newQuantity,
          averagePrice: newAveragePrice,
          currentPrice: data.currentPrice,
          totalValue: newQuantity.mul(new Prisma.Decimal(data.currentPrice)),
        },
        include: {
          asset: true,
          portfolio: true,
        },
      });
      return updatedInvestment;
    } else {
      // Cria novo investimento
      const investment = await prisma.investment.create({
        data: {
          portfolioId,
          assetId: data.assetId,
          quantity: new Prisma.Decimal(data.quantity),
          averagePrice: new Prisma.Decimal(data.currentPrice),
          currentPrice: new Prisma.Decimal(data.currentPrice),
          totalValue: new Prisma.Decimal(data.quantity).mul(new Prisma.Decimal(data.currentPrice)),
        },
        include: {
          asset: true,
          portfolio: true,
        },
      });
      return investment;
    }
  }

  /**
   * Retorna um investimento de um ativo específico de um investidor.
   * @param investorId O ID do investidor.
   * @param assetId O ID do ativo.
   * @returns O investimento encontrado.
   */
  static async getInvestmentByAsset(investorId: string, assetId: string) {
    const investment = await prisma.investment.findFirst({
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
    });
    return investment;
  }

  /**
   * Retorna todos os investimentos de um investidor com paginação.
   * @param investorId O ID do investidor.
   * @param page A página atual.
   * @param limit O número de itens por página.
   * @returns Uma lista de investimentos e informações de paginação.
   */
  static async getInvestments(investorId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [investments, total] = await Promise.all([
      prisma.investment.findMany({
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.investment.count({
        where: {
          portfolio: {
            investorId,
          },
        },
      }),
    ]);
    return {
      investments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retorna todos os portfólios de um investidor.
   * @param investorId O ID do investidor.
   * @returns Uma lista de portfólios.
   */
  static async getPortfoliosByInvestor(investorId: string) {
    const portfolios = await prisma.portfolio.findMany({
      where: { investorId },
      include: {
        investments: {
          include: {
            asset: true,
          },
        },
        _count: {
          select: {
            investments: true,
            transactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return portfolios;
  }

  /**
   * Retorna um portfólio específico de um investidor.
   * @param investorId O ID do investidor.
   * @param portfolioId O ID do portfólio.
   * @returns O portfólio encontrado.
   */
  static async getPortfolioById(investorId: string, portfolioId: string) {
    const portfolio = await prisma.portfolio.findUnique({
      where: {
        id: portfolioId,
        investorId,
      },
      include: {
        investments: {
          include: {
            asset: true,
          },
        },
        transactions: {
          include: {
            asset: true,
          },
          orderBy: { dateAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            investments: true,
            transactions: true,
          },
        },
      },
    });
    return portfolio;
  }

  /**
   * Atualiza um investimento após uma transação.
   * @param transactionId O ID da transação.
   * @returns O investimento atualizado.
   */
  static async updateInvestmentAfterTransaction(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        asset: true,
      },
    });

    if (!transaction) {
      throw new Error('Transação não encontrada');
    }

    const investment = await prisma.investment.findUnique({
      where: {
        portfolioId_assetId: {
          portfolioId: transaction.portfolioId,
          assetId: transaction.assetId,
        },
      },
    });

    if (!investment) {
      throw new Error('Investimento não encontrado');
    }

    // Recalcula baseado em todas as transações do ativo no portfólio
    const transactions = await prisma.transaction.findMany({
      where: {
        portfolioId: transaction.portfolioId,
        assetId: transaction.assetId,
      },
      orderBy: { dateAt: 'asc' },
    });

    let totalQuantity = new Prisma.Decimal(0);
    let totalCost = new Prisma.Decimal(0);

    for (const tx of transactions) {
      if (tx.type === 'Buy') {
        totalQuantity = totalQuantity.add(tx.quantity);
        totalCost = totalCost.add(tx.quantity.mul(tx.price).add(tx.fees || 0));
      } else if (tx.type === 'Sell') {
        totalQuantity = totalQuantity.sub(tx.quantity);
        totalCost = totalCost.sub(tx.quantity.mul(tx.price).sub(tx.fees || 0));
      }
    }

    const averagePrice = totalQuantity.gt(0) ? totalCost.div(totalQuantity) : new Prisma.Decimal(0);

    const updatedInvestment = await prisma.investment.update({
      where: { id: investment.id },
      data: {
        quantity: totalQuantity,
        averagePrice,
        totalValue: totalQuantity.mul(investment.currentPrice),
      },
      include: {
        asset: true,
        portfolio: true,
      },
    });

    return updatedInvestment;
  }
}