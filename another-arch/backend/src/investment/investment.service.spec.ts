import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentService } from './investment.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';

const mockPrismaService = {
  investment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  portfolio: {
    findUnique: jest.fn(),
  },
  asset: {
    findUnique: jest.fn(),
  },
};

describe('InvestmentService', () => {
  let service: InvestmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InvestmentService>(InvestmentService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an investment if portfolio and asset exist', async () => {
      const createDto: CreateInvestmentDto = {
        quantity: 10,
        totalInvested: 100,
        averagePrice: 100 / 10,
        portfolioId: 'p1',
        assetId: 'a1',
      };

      const portfolio = { id: 'p1' };

      const asset = { id: 'a1' };

      const newInvestment = {
        id: 'inv1',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        portfolio,
        asset,
        transactions: [],
      };

      mockPrismaService.portfolio.findUnique.mockResolvedValue(portfolio);
      mockPrismaService.asset.findUnique.mockResolvedValue(asset);
      mockPrismaService.investment.create.mockResolvedValue(newInvestment);

      const result = await service.create(createDto);

      expect(mockPrismaService.portfolio.findUnique).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
      expect(mockPrismaService.asset.findUnique).toHaveBeenCalledWith({
        where: { id: 'a1' },
      });
      expect(mockPrismaService.investment.create).toHaveBeenCalledWith({
        data: createDto,
        include: expect.any(Object) as object,
      });
      expect(result).toEqual(newInvestment);
    });

    it('should throw NotFoundException if portfolio does not exist', async () => {
      const createDto: CreateInvestmentDto = {
        portfolioId: 'p999',
        assetId: 'a1',
        quantity: 1,
        totalInvested: 1,
        averagePrice: 1,
      };

      mockPrismaService.portfolio.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Portfolio não encontrado'),
      );
      expect(mockPrismaService.portfolio.findUnique).toHaveBeenCalledWith({
        where: { id: 'p999' },
      });
      expect(mockPrismaService.asset.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.investment.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if asset does not exist', async () => {
      const createDto: CreateInvestmentDto = {
        portfolioId: 'p1',
        assetId: 'a999',
        quantity: 1,
        totalInvested: 1,
        averagePrice: 1,
      };
      const portfolio = { id: 'p1' };

      mockPrismaService.portfolio.findUnique.mockResolvedValue(portfolio);

      mockPrismaService.asset.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Ativo não encontrado'),
      );
      expect(mockPrismaService.portfolio.findUnique).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
      expect(mockPrismaService.asset.findUnique).toHaveBeenCalledWith({
        where: { id: 'a999' },
      });
      expect(mockPrismaService.investment.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate investment (P2002)', async () => {
      const createDto: CreateInvestmentDto = {
        portfolioId: 'p1',
        assetId: 'a1',
        quantity: 1,
        totalInvested: 1,
        averagePrice: 1,
      };
      const portfolio = { id: 'p1' };

      const asset = { id: 'a1' };

      const prismaError = {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['portfolioId', 'assetId'] },
      };

      mockPrismaService.portfolio.findUnique.mockResolvedValue(portfolio);
      mockPrismaService.asset.findUnique.mockResolvedValue(asset);
      mockPrismaService.investment.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException(
          'Investimento já existe para este ativo no portfolio',
        ),
      );
    });
  });

  describe('findAll', () => {
    it('should return a list of investments', async () => {
      const investments = [{ id: 'inv1' }, { id: 'inv2' }];

      mockPrismaService.investment.findMany.mockResolvedValue(investments);

      const result = await service.findAll();

      expect(result).toEqual(investments);
      expect(mockPrismaService.investment.findMany).toHaveBeenCalledWith({
        include: expect.any(Object) as object,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single investment by id', async () => {
      const investment = { id: 'inv1', quantity: 10, totalInvested: 100 };

      mockPrismaService.investment.findUnique.mockResolvedValue(investment);

      const result = await service.findOne('inv1');

      expect(result).toEqual(investment);
      expect(mockPrismaService.investment.findUnique).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        include: expect.any(Object) as object,
      });
    });

    it('should throw NotFoundException if investment is not found', async () => {
      mockPrismaService.investment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('inv999')).rejects.toThrow(
        new NotFoundException('Investimento com ID inv999 não encontrado'),
      );
    });
  });

  describe('update', () => {
    it('should update an investment', async () => {
      const updateDto: UpdateInvestmentDto = {
        quantity: 20,
      };

      const updatedInvestment = { id: 'inv1', ...updateDto };

      mockPrismaService.investment.update.mockResolvedValue(updatedInvestment);

      const result = await service.update('inv1', updateDto);

      expect(result).toEqual(updatedInvestment);
      expect(mockPrismaService.investment.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: updateDto,
        include: expect.any(Object) as object,
      });
    });

    it('should throw NotFoundException if investment to update is not found (P2025)', async () => {
      const updateDto: UpdateInvestmentDto = {
        quantity: 20,
      };

      const prismaError = { code: 'P2025' };

      mockPrismaService.investment.update.mockRejectedValue(prismaError);

      await expect(service.update('inv999', updateDto)).rejects.toThrow(
        new NotFoundException('Investimento com ID inv999 não encontrado'),
      );
    });
  });

  describe('remove', () => {
    it('should remove an investment', async () => {
      const removedInvestment = { id: 'inv1' };

      mockPrismaService.investment.delete.mockResolvedValue(removedInvestment);

      const result = await service.remove('inv1');

      expect(result).toEqual(removedInvestment);
      expect(mockPrismaService.investment.delete).toHaveBeenCalledWith({
        where: { id: 'inv1' },
      });
    });

    it('should throw NotFoundException if investment to remove is not found (P2025)', async () => {
      const prismaError = { code: 'P2025' };

      mockPrismaService.investment.delete.mockRejectedValue(prismaError);

      await expect(service.remove('inv999')).rejects.toThrow(
        new NotFoundException('Investimento com ID inv999 não encontrado'),
      );
    });
  });
});
