import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentController } from './investment.controller';
import { InvestmentService } from './investment.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { NotFoundException } from '@nestjs/common';

const mockInvestmentService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('InvestmentController', () => {
  let controller: InvestmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentController],
      providers: [
        {
          provide: InvestmentService,
          useValue: mockInvestmentService,
        },
      ],
    }).compile();

    controller = module.get<InvestmentController>(InvestmentController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call investmentService.create with the correct DTO', async () => {
      const createDto: CreateInvestmentDto = {
        portfolioId: 'p1',
        assetId: 'a1',
        quantity: 10,
        totalInvested: 100,
        averagePrice: 100 / 10,
      };

      const createdInvestment = { id: 'inv1', ...createDto };

      mockInvestmentService.create.mockResolvedValue(createdInvestment);

      const result = await controller.create(createDto);

      expect(mockInvestmentService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdInvestment);
    });
  });

  describe('findAll', () => {
    it('should call investmentService.findAll and return a list of investments', async () => {
      const investments = [{ id: 'inv1' }, { id: 'inv2' }];

      mockInvestmentService.findAll.mockResolvedValue(investments);

      const result = await controller.findAll();

      expect(mockInvestmentService.findAll).toHaveBeenCalled();
      expect(result).toEqual(investments);
    });
  });

  describe('findOne', () => {
    it('should call investmentService.findOne with the correct id', async () => {
      const investment = { id: 'inv1' };

      mockInvestmentService.findOne.mockResolvedValue(investment);

      const result = await controller.findOne('inv1');

      expect(mockInvestmentService.findOne).toHaveBeenCalledWith('inv1');
      expect(result).toEqual(investment);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      mockInvestmentService.findOne.mockRejectedValue(
        new NotFoundException('Investment com ID inv999 não encontrado'),
      );

      await expect(controller.findOne('inv999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should call investmentService.update with the correct id and DTO', async () => {
      const updateDto: UpdateInvestmentDto = {
        quantity: 20,
      };

      const updatedInvestment = { id: 'inv1', ...updateDto };

      mockInvestmentService.update.mockResolvedValue(updatedInvestment);

      const result = await controller.update('inv1', updateDto);

      expect(mockInvestmentService.update).toHaveBeenCalledWith(
        'inv1',
        updateDto,
      );
      expect(result).toEqual(updatedInvestment);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      const updateDto: UpdateInvestmentDto = {
        quantity: 20,
      };

      mockInvestmentService.update.mockRejectedValue(
        new NotFoundException('Investment com ID inv999 não encontrado'),
      );

      await expect(controller.update('inv999', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should call investmentService.remove with the correct id', async () => {
      const removedInvestment = { id: 'inv1' };

      mockInvestmentService.remove.mockResolvedValue(removedInvestment);

      const result = await controller.remove('inv1');

      expect(mockInvestmentService.remove).toHaveBeenCalledWith('inv1');
      expect(result).toEqual(removedInvestment);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      mockInvestmentService.remove.mockRejectedValue(
        new NotFoundException('Investment com ID inv999 não encontrado'),
      );

      await expect(controller.remove('inv999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
