import { Test, TestingModule } from '@nestjs/testing';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { NotFoundException } from '@nestjs/common';

// Mock do AssetService para isolar o controlador nos testes
const mockAssetService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
};

describe('AssetController', () => {
  let controller: AssetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetController],
      providers: [
        {
          provide: AssetService,
          useValue: mockAssetService,
        },
      ],
    }).compile();

    controller = module.get<AssetController>(AssetController);
    controller = module.get<AssetController>(AssetController);
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call assetService.create with the correct DTO', async () => {
      const createAssetDto: CreateAssetDto = {
        symbol: 'PETR4',
        name: 'Petrobras',
        type: 'STOCK',
      };
      const createdAsset = { ...createAssetDto, createdAt: new Date() };

      mockAssetService.create.mockResolvedValue(createdAsset);

      const result = await controller.create(createAssetDto);
      expect(mockAssetService.create).toHaveBeenCalledWith(createAssetDto);
      expect(result).toEqual(createdAsset);
    });
  });

  describe('findAll', () => {
    it('should call assetService.findAll and return a list of assets', async () => {
      const assets = [
        {
          id: 'PETR4',
          symbol: 'PETR4',
          name: 'Petrobras',
          investments: [],
          createdAt: new Date(),
        },
      ];
      mockAssetService.findAll.mockResolvedValue(assets);

      const result = await controller.findAll();
      expect(mockAssetService.findAll).toHaveBeenCalled();
      expect(result).toEqual(assets);
    });
  });

  describe('findOne', () => {
    it('should call assetService.findOne with the correct id', async () => {
      const asset = {
        id: 'PETR4',
        symbol: 'PETR4',
        name: 'Petrobras',
        investments: [],
        createdAt: new Date(),
      };
      mockAssetService.findOne.mockResolvedValue(asset);

      const result = await controller.findOne('PETR4');
      expect(mockAssetService.findOne).toHaveBeenCalledWith('PETR4');
      expect(result).toEqual(asset);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      mockAssetService.findOne.mockRejectedValue(
        new NotFoundException('Ativo com ID PETR4 não encontrado'),
      );

      await expect(controller.findOne('PETR4')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
