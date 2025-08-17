import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from './asset.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AssetType, Prisma } from '@prisma/client';

const mockPrismaService = {
  asset: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

const createAssetDto = {
  id: 'PETR4',
  symbol: 'PETR4',
  name: 'Petrobras',
  type: AssetType.STOCK,
};

describe('AssetService', () => {
  let service: AssetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AssetService>(AssetService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new asset', async () => {
      const newAsset = { ...createAssetDto, createdAt: new Date() };

      mockPrismaService.asset.create.mockResolvedValue(newAsset);

      const result = await service.create(createAssetDto);
      expect(result).toEqual(newAsset);
      expect(mockPrismaService.asset.create).toHaveBeenCalledWith({
        data: createAssetDto,
      });
    });

    it('should throw ConflictException if asset symbol already exists', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Símbolo já cadastrado',
        { code: 'P2002', clientVersion: '2.25.0' },
      );

      mockPrismaService.asset.create.mockRejectedValue(error);

      await expect(service.create(createAssetDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should re-throw other errors', async () => {
      const error = new Error('Database connection failed');

      mockPrismaService.asset.create.mockRejectedValue(error);

      await expect(service.create(createAssetDto)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return a list of assets with investments', async () => {
      const assets = [
        {
          id: 'PETR4',
          symbol: 'PETR4',
          name: 'Petrobras',
          investments: [],
          createdAt: new Date(),
        },
        {
          id: 'VALE3',
          symbol: 'VALE3',
          name: 'Vale',
          investments: [],
          createdAt: new Date(),
        },
      ];
      mockPrismaService.asset.findMany.mockResolvedValue(assets);

      const result = await service.findAll();
      expect(result).toEqual(assets);
      expect(mockPrismaService.asset.findMany).toHaveBeenCalledWith({
        include: {
          investments: true,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single asset by id', async () => {
      const asset = {
        id: 'PETR4',
        symbol: 'PETR4',
        name: 'Petrobras',
        investments: [],
        createdAt: new Date(),
      };
      mockPrismaService.asset.findUnique.mockResolvedValue(asset);

      const result = await service.findOne('PETR4');
      expect(result).toEqual(asset);
      expect(mockPrismaService.asset.findUnique).toHaveBeenCalledWith({
        where: { id: 'PETR4' },
        include: {
          investments: {
            include: {
              portfolio: {
                include: {
                  investor: true,
                },
              },
            },
          },
        },
      });
    });

    it('should throw NotFoundException if asset is not found', async () => {
      mockPrismaService.asset.findUnique.mockResolvedValue(null);

      await expect(service.findOne('PETR4')).rejects.toThrow(NotFoundException);
    });
  });
});
