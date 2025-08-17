import { Test, TestingModule } from '@nestjs/testing';
import { InvestorController } from './investor.controller';
import { InvestorService } from './investor.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';
import { DeactivateInvestorDto } from './dto/deactivate-investor.dto';
import { NotFoundException } from '@nestjs/common';

const mockInvestorService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findActiveInvestors: jest.fn(),
  findInactiveInvestors: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
  remove: jest.fn(),
};

describe('InvestorController', () => {
  let controller: InvestorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestorController],
      providers: [
        {
          provide: InvestorService,
          useValue: mockInvestorService,
        },
      ],
    }).compile();

    controller = module.get<InvestorController>(InvestorController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call investorService.create with the correct DTO', async () => {
      const createInvestorDto: CreateInvestorDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        cpf: '12345678901',
      };
      const createdInvestor = { id: '1', ...createInvestorDto };
      mockInvestorService.create.mockResolvedValue(createdInvestor);

      const result = await controller.create(createInvestorDto);
      expect(mockInvestorService.create).toHaveBeenCalledWith(
        createInvestorDto,
      );
      expect(result).toEqual(createdInvestor);
    });
  });

  describe('findAll', () => {
    it('should call investorService.findAll with false by default', async () => {
      const investors = [{ id: '1', isActive: true }];
      mockInvestorService.findAll.mockResolvedValue(investors);

      const result = await controller.findAll();
      expect(mockInvestorService.findAll).toHaveBeenCalledWith(false);
      expect(result).toEqual(investors);
    });

    it('should call investorService.findAll with true if query param is "true"', async () => {
      const investors = [
        { id: '1', isActive: true },
        { id: '2', isActive: false },
      ];
      mockInvestorService.findAll.mockResolvedValue(investors);

      const result = await controller.findAll('true');
      expect(mockInvestorService.findAll).toHaveBeenCalledWith(true);
      expect(result).toEqual(investors);
    });
  });

  describe('findActiveInvestors', () => {
    it('should call investorService.findActiveInvestors', async () => {
      const investors = [{ id: '1', isActive: true }];
      mockInvestorService.findActiveInvestors.mockResolvedValue(investors);

      const result = await controller.findActiveInvestors();
      expect(mockInvestorService.findActiveInvestors).toHaveBeenCalled();
      expect(result).toEqual(investors);
    });
  });

  describe('findInactiveInvestors', () => {
    it('should call investorService.findInactiveInvestors', async () => {
      const investors = [{ id: '1', isActive: false }];
      mockInvestorService.findInactiveInvestors.mockResolvedValue(investors);

      const result = await controller.findInactiveInvestors();
      expect(mockInvestorService.findInactiveInvestors).toHaveBeenCalled();
      expect(result).toEqual(investors);
    });
  });

  describe('findOne', () => {
    it('should call investorService.findOne with the correct id', async () => {
      const investor = { id: '1', name: 'John Doe' };
      mockInvestorService.findOne.mockResolvedValue(investor);

      const result = await controller.findOne('1');
      expect(mockInvestorService.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(investor);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      mockInvestorService.findOne.mockRejectedValue(
        new NotFoundException('Investidor com ID 999 não encontrado'),
      );

      await expect(controller.findOne('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should call investorService.update with id and DTO', async () => {
      const updateInvestorDto: UpdateInvestorDto = {
        email: 'new.email@example.com',
      };
      const updatedInvestor = { id: '1', ...updateInvestorDto };
      mockInvestorService.update.mockResolvedValue(updatedInvestor);

      const result = await controller.update('1', updateInvestorDto);
      expect(mockInvestorService.update).toHaveBeenCalledWith(
        '1',
        updateInvestorDto,
      );
      expect(result).toEqual(updatedInvestor);
    });
  });

  describe('deactivate', () => {
    it('should call investorService.deactivate with id and DTO', async () => {
      const deactivateInvestorDto: DeactivateInvestorDto = { isActive: false };
      const deactivatedInvestor = {
        id: '1',
        isActive: false,
        message: 'Investidor desativado com sucesso',
      };
      mockInvestorService.deactivate.mockResolvedValue(deactivatedInvestor);

      const result = await controller.deactivate('1', deactivateInvestorDto);
      expect(mockInvestorService.deactivate).toHaveBeenCalledWith(
        '1',
        deactivateInvestorDto,
      );
      expect(result).toEqual(deactivatedInvestor);
    });
  });

  describe('remove', () => {
    it('should call investorService.remove with the correct id', async () => {
      const removedInvestor = { id: '1', name: 'John Doe' };
      mockInvestorService.remove.mockResolvedValue(removedInvestor);

      const result = await controller.remove('1');
      expect(mockInvestorService.remove).toHaveBeenCalledWith('1');
      expect(result).toEqual(removedInvestor);
    });
  });
});
