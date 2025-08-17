import { Test, TestingModule } from '@nestjs/testing';
import { InvestorService } from './investor.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const mockPrismaService = {
  investor: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('InvestorService', () => {
  let service: InvestorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InvestorService>(InvestorService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new investor', async () => {
      const createInvestorDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        cpf: '12345678901',
      };

      const newInvestor = {
        id: '1',
        ...createInvestorDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.investor.create.mockResolvedValue(newInvestor);

      const result = await service.create(createInvestorDto);
      expect(result).toEqual(newInvestor);
      expect(mockPrismaService.investor.create).toHaveBeenCalledWith({
        data: createInvestorDto,
      });
    });

    it('should throw ConflictException if email or cpf already exists', async () => {
      const createInvestorDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        cpf: '12345678901',
      };

      const error = new Prisma.PrismaClientKnownRequestError(
        'Email ou CPF já cadastrado',
        { code: 'P2002', clientVersion: '2.25.0' },
      );

      mockPrismaService.investor.create.mockRejectedValue(error);

      await expect(service.create(createInvestorDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw other errors', async () => {
      const createInvestorDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        cpf: '12345678901',
      };

      const error = new Error('Database connection failed');

      mockPrismaService.investor.create.mockRejectedValue(error);

      await expect(service.create(createInvestorDto)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return all active investors by default', async () => {
      const investors = [
        {
          id: '1',
          isActive: true,
          name: 'John Doe',
        },
      ];

      mockPrismaService.investor.findMany.mockResolvedValue(investors);

      const result = await service.findAll();

      expect(result).toEqual(investors);
      expect(mockPrismaService.investor.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: expect.any(Object) as object,
      });
    });

    it('should return all investors including inactive if includeInactive is true', async () => {
      const investors = [
        {
          id: '1',
          isActive: true,
          name: 'John Doe',
        },
        {
          id: '2',
          isActive: false,
          name: 'Jane Smith',
        },
      ];

      mockPrismaService.investor.findMany.mockResolvedValue(investors);

      const result = await service.findAll(true);
      expect(result).toEqual(investors);
      expect(mockPrismaService.investor.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object) as object,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single investor by id', async () => {
      const investor = {
        id: '1',
        name: 'John Doe',
        portfolios: [],
      };

      mockPrismaService.investor.findUnique.mockResolvedValue(investor);

      const result = await service.findOne('1');

      expect(result).toEqual(investor);
      expect(mockPrismaService.investor.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object) as object,
      });
    });

    it('should throw NotFoundException if investor is not found', async () => {
      mockPrismaService.investor.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an investor', async () => {
      const updateInvestorDto = {
        email: 'new.email@example.com',
      };

      const updatedInvestor = {
        id: '1',
        name: 'John Doe',
        email: 'new.email@example.com',
      };

      mockPrismaService.investor.update.mockResolvedValue(updatedInvestor);

      const result = await service.update('1', updateInvestorDto);
      expect(result).toEqual(updatedInvestor);
      expect(mockPrismaService.investor.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateInvestorDto,
      });
    });

    it('should throw NotFoundException if investor to update is not found', async () => {
      const updateInvestorDto = {
        email: 'new.email@example.com',
      };

      const error = new Prisma.PrismaClientKnownRequestError(
        'Investidor não encontrado',
        { code: 'P2025', clientVersion: '2.25.0' },
      );

      mockPrismaService.investor.update.mockRejectedValue(error);

      await expect(service.update('999', updateInvestorDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if updated email or cpf already exists', async () => {
      const updateInvestorDto = {
        email: 'existing.email@example.com',
      };

      const error = new Prisma.PrismaClientKnownRequestError(
        'Email ou CPF já cadastrado',
        { code: 'P2002', clientVersion: '2.25.0' },
      );

      mockPrismaService.investor.update.mockRejectedValue(error);

      await expect(service.update('1', updateInvestorDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate an investor', async () => {
      const deactivateInvestorDto = { isActive: false };

      const deactivatedInvestor = {
        id: '1',
        isActive: false,
        message: 'Investidor desativado com sucesso',
      };

      mockPrismaService.investor.update.mockResolvedValue({
        id: '1',
        isActive: false,
      });

      const result = await service.deactivate('1', deactivateInvestorDto);

      expect(result).toEqual(deactivatedInvestor);
      expect(mockPrismaService.investor.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false, updatedAt: expect.any(Date) as Date },
      });
    });

    it('should activate an investor', async () => {
      const activateInvestorDto = { isActive: true };

      const activatedInvestor = {
        id: '1',
        isActive: true,
        message: 'Investidor ativado com sucesso',
      };

      mockPrismaService.investor.update.mockResolvedValue({
        id: '1',
        isActive: true,
      });

      const result = await service.deactivate('1', activateInvestorDto);

      expect(result).toEqual(activatedInvestor);
      expect(mockPrismaService.investor.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: true, updatedAt: expect.any(Date) as Date },
      });
    });

    it('should throw NotFoundException if investor to deactivate is not found', async () => {
      const deactivateInvestorDto = { isActive: false };

      const error = new Prisma.PrismaClientKnownRequestError(
        'Investidor não encontrado',
        { code: 'P2025', clientVersion: '2.25.0' },
      );

      mockPrismaService.investor.update.mockRejectedValue(error);

      await expect(
        service.deactivate('999', deactivateInvestorDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should permanently delete an investor with no investments', async () => {
      const investor = {
        id: '1',
        name: 'John Doe',
        portfolios: [{ id: 'p1', investments: [] }],
      };

      const deletedInvestor = { id: '1', name: 'John Doe' };

      mockPrismaService.investor.findUnique.mockResolvedValue(investor);
      mockPrismaService.investor.delete.mockResolvedValue(deletedInvestor);

      const result = await service.remove('1');

      expect(mockPrismaService.investor.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { portfolios: { include: { investments: true } } },
      });
      expect(mockPrismaService.investor.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(deletedInvestor);
    });

    it('should deactivate an investor with active investments instead of deleting', async () => {
      const investor = {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        cpf: '12345678901',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        portfolios: [{ id: 'p1', investments: [{ id: 'i1' }] }],
      };

      const deactivatedInvestor = {
        ...investor,
        isActive: false,
        message: 'Investidor desativado com sucesso',
      };

      jest.spyOn(service, 'deactivate').mockResolvedValue(deactivatedInvestor);
      mockPrismaService.investor.findUnique.mockResolvedValue(investor);

      const result = await service.remove('1');
      expect(mockPrismaService.investor.findUnique).toHaveBeenCalled();
      expect(service.deactivate).toHaveBeenCalledWith('1', { isActive: false });
      expect(mockPrismaService.investor.delete).not.toHaveBeenCalled();
      expect(result).toEqual(deactivatedInvestor);
    });

    it('should throw NotFoundException if investor to remove is not found', async () => {
      mockPrismaService.investor.findUnique.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findActiveInvestors', () => {
    it('should return a list of active investors', async () => {
      const activeInvestors = [{ id: '1', isActive: true }];

      mockPrismaService.investor.findMany.mockResolvedValue(activeInvestors);

      const result = await service.findActiveInvestors();

      expect(result).toEqual(activeInvestors);
      expect(mockPrismaService.investor.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: expect.any(Object) as object,
      });
    });
  });

  describe('findInactiveInvestors', () => {
    it('should return a list of inactive investors', async () => {
      const inactiveInvestors = [{ id: '1', isActive: false }];

      mockPrismaService.investor.findMany.mockResolvedValue(inactiveInvestors);

      const result = await service.findInactiveInvestors();

      expect(result).toEqual(inactiveInvestors);
      expect(mockPrismaService.investor.findMany).toHaveBeenCalledWith({
        where: { isActive: false },
        include: expect.any(Object) as object,
      });
    });
  });
});
