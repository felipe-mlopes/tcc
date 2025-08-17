import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type PortfolioWithInvestments = Prisma.PortfolioGetPayload<{
  include: {
    investor: true;
    investments: {
      include: {
        asset: true;
        transactions: true;
      };
    };
  };
}>;

const mockPrismaService = {
  portfolio: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  investor: {
    findUnique: jest.fn(),
  },
};

describe('PortfolioService', () => {
  let service: PortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new portfolio if the investor exists', async () => {
      const createPortfolioDto = {
        name: 'My Investment Portfolio',
        investorId: 'investor-1',
      };

      const investor = { id: 'investor-1', name: 'John Doe' };

      const newPortfolio = {
        id: 'portfolio-1',
        ...createPortfolioDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.investor.findUnique.mockResolvedValue(investor);
      mockPrismaService.portfolio.create.mockResolvedValue(newPortfolio);

      const result = await service.create(createPortfolioDto);

      expect(mockPrismaService.investor.findUnique).toHaveBeenCalledWith({
        where: { id: 'investor-1' },
      });

      expect(mockPrismaService.portfolio.create).toHaveBeenCalledWith({
        data: createPortfolioDto,
        include: expect.any(Object) as object,
      });

      expect(result).toEqual(newPortfolio);
    });

    it('should throw NotFoundException if the investor does not exist', async () => {
      const createPortfolioDto = {
        name: 'My Investment Portfolio',
        investorId: 'investor-999',
      };

      mockPrismaService.investor.findUnique.mockResolvedValue(null);

      await expect(service.create(createPortfolioDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrismaService.investor.findUnique).toHaveBeenCalledWith({
        where: { id: 'investor-999' },
      });

      expect(mockPrismaService.portfolio.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return a list of portfolios', async () => {
      const portfolios = [
        { id: 'p1', name: 'Port 1', investor: null, investments: [] },
        { id: 'p2', name: 'Port 2', investor: null, investments: [] },
      ];

      mockPrismaService.portfolio.findMany.mockResolvedValue(portfolios);

      const result = await service.findAll();

      expect(result).toEqual(portfolios);
      expect(mockPrismaService.portfolio.findMany).toHaveBeenCalledWith({
        include: expect.any(Object) as object,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single portfolio by id', async () => {
      const portfolio = {
        id: 'p1',
        name: 'Port 1',
        investor: null,
        investments: [],
      };

      mockPrismaService.portfolio.findUnique.mockResolvedValue(portfolio);

      const result = await service.findOne('p1');

      expect(result).toEqual(portfolio);
      expect(mockPrismaService.portfolio.findUnique).toHaveBeenCalledWith({
        where: { id: 'p1' },
        include: expect.any(Object) as object,
      });
    });

    it('should throw NotFoundException if portfolio is not found', async () => {
      mockPrismaService.portfolio.findUnique.mockResolvedValue(null);

      await expect(service.findOne('p999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPortfolioSummary', () => {
    it('should return a summary of the portfolio', async () => {
      const portfolio: PortfolioWithInvestments = {
        id: 'p1',
        name: 'Port 1',
        investorId: 'investor-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        investor: {
          id: 'investor-1',
          name: 'John Doe',
          cpf: '12345678901',
          email: 'john-doe@test.com',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        investments: [
          {
            id: 'inv-1',
            portfolioId: 'p1',
            assetId: 'asset-1',
            quantity: new Prisma.Decimal(10),
            totalInvested: new Prisma.Decimal(300),
            averagePrice: new Prisma.Decimal(30),
            createdAt: new Date(),
            updatedAt: new Date(),
            asset: {
              id: 'asset-1',
              symbol: 'PETR4',
              name: 'Petrobras',
              description: 'Ação da Petrobras',
              type: 'STOCK',
              sector: 'Energy',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            transactions: [],
          },
          {
            id: 'inv-2',
            portfolioId: 'p1',
            assetId: 'asset-2',
            quantity: new Prisma.Decimal(5),
            totalInvested: new Prisma.Decimal(250),
            averagePrice: new Prisma.Decimal(50),
            createdAt: new Date(),
            updatedAt: new Date(),
            asset: {
              id: 'asset-2',
              symbol: 'VALE3',
              name: 'Vale',
              description: 'Ação da Vale',
              type: 'STOCK',
              sector: 'Mining',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            transactions: [],
          },
        ],
      };

      const expectedSummary = {
        totalInvested: 550,
        totalAssets: 2,
        assetDistribution: [
          {
            asset: 'PETR4',
            quantity: 10,
            totalInvested: 300,
            averagePrice: 30,
          },
          {
            asset: 'VALE3',
            quantity: 5,
            totalInvested: 250,
            averagePrice: 50,
          },
        ],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(portfolio);

      const result = await service.getPortfolioSummary('p1');
      expect(result).toEqual(expectedSummary);
      expect(service.findOne).toHaveBeenCalledWith('p1');
    });

    it('should handle a portfolio with no investments', async () => {
      const portfolio: PortfolioWithInvestments = {
        id: 'p1',
        name: 'Port 1',
        investorId: 'investor-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        investor: {
          id: 'investor-1',
          name: 'John Doe',
          cpf: '12345678901',
          email: 'john-doe@test.com',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        investments: [],
      };

      const expectedSummary = {
        totalInvested: 0,
        totalAssets: 0,
        assetDistribution: [],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(portfolio);

      const result = await service.getPortfolioSummary('p1');
      expect(result).toEqual(expectedSummary);
      expect(service.findOne).toHaveBeenCalledWith('p1');
    });

    it('should throw NotFoundException if portfolio is not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.getPortfolioSummary('p999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
