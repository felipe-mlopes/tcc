import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

// Define um tipo para o objeto retornado pelo findUnique e create
type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: {
    investment: {
      include: {
        portfolio: {
          include: {
            investor: true;
          };
        };
        asset: true;
      };
    };
  };
}>;

const mockPrismaService = {
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  investment: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new transaction and update the investment', async () => {
      const createDto: CreateTransactionDto = {
        investmentId: 'inv1',
        type: TransactionType.BUY,
        quantity: 10,
        price: 10,
        totalAmount: 100,
        executedAt: '2023-01-01T10:00:00Z',
      };

      const mockInvestment = {
        id: 'inv1',
        quantity: new Prisma.Decimal(10),
        totalInvested: new Prisma.Decimal(100),
      };

      const mockTransaction: TransactionWithRelations = {
        id: 'tx1',
        investmentId: 'inv1',
        type: TransactionType.BUY,
        quantity: new Prisma.Decimal(10),
        price: new Prisma.Decimal(10),
        totalAmount: new Prisma.Decimal(100),
        fees: new Prisma.Decimal(0),
        executedAt: new Date('2023-01-01T10:00:00Z'),
        createdAt: new Date(),
        investment: {
          id: 'inv1',
          quantity: new Prisma.Decimal(10),
          totalInvested: new Prisma.Decimal(100),
          averagePrice: new Prisma.Decimal(10),
          portfolioId: 'p1',
          assetId: 'a1',
          createdAt: new Date(),
          updatedAt: new Date(),
          portfolio: {
            id: 'p1',
            name: 'Portfolio 1',
            investorId: 'inv1',
            createdAt: new Date(),
            updatedAt: new Date(),
            investor: {
              id: 'inv1',
              name: 'Investor 1',
              email: 'investor@test.com',
              createdAt: new Date(),
              updatedAt: new Date(),
              cpf: '12345678900',
              isActive: true,
            },
          },
          asset: {
            id: 'a1',
            symbol: 'ASSET1',
            name: 'Asset 1',
            type: 'STOCK',
            sector: 'TECH',
            description: 'A tech stock',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      };

      jest
        .spyOn(service, 'updateInvestmentAfterTransaction' as any)
        .mockResolvedValue(undefined);
      mockPrismaService.investment.findUnique.mockResolvedValue(mockInvestment);
      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.create(createDto);

      expect(mockPrismaService.investment.findUnique).toHaveBeenCalledWith({
        where: { id: 'inv1' },
      });
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: { ...createDto, executedAt: new Date(createDto.executedAt) },
        include: expect.any(Object) as object,
      });
      expect(service['updateInvestmentAfterTransaction']).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if investment does not exist', async () => {
      const createDto: CreateTransactionDto = {
        investmentId: 'inv999',
        type: TransactionType.BUY,
        quantity: 10,
        price: 10,
        totalAmount: 100,
        executedAt: '2023-01-01T10:00:00Z',
      };

      mockPrismaService.investment.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Investimento não encontrado'),
      );
      expect(mockPrismaService.investment.findUnique).toHaveBeenCalledWith({
        where: { id: 'inv999' },
      });
      expect(mockPrismaService.transaction.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return a list of transactions', async () => {
      const transactions = [{ id: 'tx1' }, { id: 'tx2' }];

      mockPrismaService.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.findAll();

      expect(result).toEqual(transactions);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        include: expect.any(Object) as object,
        orderBy: { executedAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single transaction by id', async () => {
      const transaction = { id: 'tx1' };

      mockPrismaService.transaction.findUnique.mockResolvedValue(transaction);

      const result = await service.findOne('tx1');

      expect(result).toEqual(transaction);
      expect(mockPrismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'tx1' },
        include: expect.any(Object) as object,
      });
    });

    it('should throw NotFoundException if transaction is not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.findOne('tx999')).rejects.toThrow(
        new NotFoundException('Transação com ID tx999 não encontrada'),
      );
    });
  });

  describe('update', () => {
    it('should update a transaction and the associated investment', async () => {
      const updateDto: UpdateTransactionDto = {
        quantity: 20,
        executedAt: '2023-01-02T10:00:00Z',
      };

      const updatedTransaction: TransactionWithRelations = {
        id: 'tx1',
        investmentId: 'inv1',
        type: TransactionType.BUY,
        quantity: new Prisma.Decimal(20),
        price: new Prisma.Decimal(10),
        totalAmount: new Prisma.Decimal(200),
        fees: new Prisma.Decimal(0),
        executedAt: new Date('2023-01-02T10:00:00Z'),
        createdAt: new Date(),
        investment: {
          id: 'inv1',
          quantity: new Prisma.Decimal(20),
          totalInvested: new Prisma.Decimal(200),
          averagePrice: new Prisma.Decimal(10),
          portfolioId: 'p1',
          assetId: 'a1',
          createdAt: new Date(),
          updatedAt: new Date(),
          portfolio: {
            id: 'p1',
            name: 'Portfolio 1',
            investorId: 'inv1',
            createdAt: new Date(),
            updatedAt: new Date(),
            investor: {
              id: 'inv1',
              name: 'Investor 1',
              email: 'investor@test.com',
              createdAt: new Date(),
              updatedAt: new Date(),
              cpf: '12345678900',
              isActive: true,
            },
          },
          asset: {
            id: 'a1',
            symbol: 'ASSET1',
            name: 'Asset 1',
            type: 'STOCK',
            sector: 'TECH',
            description: 'A tech stock',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      };

      jest
        .spyOn(service, 'updateInvestmentAfterTransaction' as any)
        .mockResolvedValue(undefined);
      mockPrismaService.transaction.update.mockResolvedValue(
        updatedTransaction,
      );

      const result = await service.update('tx1', updateDto);

      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx1' },
        data: {
          ...updateDto,
          executedAt: new Date(updateDto.executedAt!),
        },
        include: expect.any(Object) as object,
      });
      expect(service['updateInvestmentAfterTransaction']).toHaveBeenCalled();
      expect(result).toEqual(updatedTransaction);
    });

    it('should throw NotFoundException if transaction to update is not found (P2025)', async () => {
      const updateDto: UpdateTransactionDto = {
        quantity: 20,
      };

      const prismaError = { code: 'P2025' };

      mockPrismaService.transaction.update.mockRejectedValue(prismaError);

      await expect(service.update('tx999', updateDto)).rejects.toThrow(
        new NotFoundException('Transação com ID tx999 não encontrada'),
      );
    });
  });

  describe('remove', () => {
    it('should remove a transaction and update the associated investment', async () => {
      const removedTransaction: TransactionWithRelations = {
        id: 'tx1',
        investmentId: 'inv1',
        type: TransactionType.BUY,
        quantity: new Prisma.Decimal(10),
        price: new Prisma.Decimal(10),
        totalAmount: new Prisma.Decimal(100),
        fees: new Prisma.Decimal(0),
        executedAt: new Date('2023-01-01T10:00:00Z'),
        createdAt: new Date(),
        investment: {
          id: 'inv1',
          quantity: new Prisma.Decimal(10),
          totalInvested: new Prisma.Decimal(100),
          averagePrice: new Prisma.Decimal(10),
          portfolioId: 'p1',
          assetId: 'a1',
          createdAt: new Date(),
          updatedAt: new Date(),
          portfolio: {
            id: 'p1',
            name: 'Portfolio 1',
            investorId: 'inv1',
            createdAt: new Date(),
            updatedAt: new Date(),
            investor: {
              id: 'inv1',
              name: 'Investor 1',
              email: 'investor@test.com',
              createdAt: new Date(),
              updatedAt: new Date(),
              cpf: '12345678900',
              isActive: true,
            },
          },
          asset: {
            id: 'a1',
            symbol: 'ASSET1',
            name: 'Asset 1',
            type: 'STOCK',
            sector: 'TECH',
            description: 'A tech stock',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      };

      jest
        .spyOn(service, 'updateInvestmentAfterTransaction' as any)
        .mockResolvedValue(undefined);
      mockPrismaService.transaction.delete.mockResolvedValue(
        removedTransaction,
      );

      const result = await service.remove('tx1');
      expect(mockPrismaService.transaction.delete).toHaveBeenCalledWith({
        where: { id: 'tx1' },
        include: expect.any(Object) as object,
      });
      expect(service['updateInvestmentAfterTransaction']).toHaveBeenCalled();
      expect(result).toEqual(removedTransaction);
    });

    it('should throw NotFoundException if transaction to remove is not found (P2025)', async () => {
      const prismaError = { code: 'P2025' };

      mockPrismaService.transaction.delete.mockRejectedValue(prismaError);

      await expect(service.remove('tx999')).rejects.toThrow(
        new NotFoundException('Transação com ID tx999 não encontrada'),
      );
    });
  });

  describe('findByInvestment', () => {
    it('should return a list of transactions for a given investment', async () => {
      const transactions = [{ id: 'tx1' }, { id: 'tx2' }];

      mockPrismaService.transaction.findMany.mockResolvedValue(transactions);

      const result = await service.findByInvestment('inv1');

      expect(result).toEqual(transactions);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { investmentId: 'inv1' },
        orderBy: { executedAt: 'desc' },
        include: expect.any(Object) as object,
      });
    });
  });
});
