import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';

const mockTransactionService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByInvestment: jest.fn(),
};

describe('TransactionController', () => {
  let controller: TransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call transactionService.create with the correct DTO', async () => {
      const createDto: CreateTransactionDto = {
        investmentId: 'inv1',
        type: TransactionType.BUY,
        quantity: 10,
        price: 10,
        totalAmount: 100,
        executedAt: '2023-01-01T10:00:00Z',
      };

      const createdTransaction = { id: 'tx1', ...createDto };

      mockTransactionService.create.mockResolvedValue(createdTransaction);

      const result = await controller.create(createDto);

      expect(mockTransactionService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdTransaction);
    });
  });

  describe('findAll', () => {
    it('should call transactionService.findAll and return a list of transactions', async () => {
      const transactions = [{ id: 'tx1' }, { id: 'tx2' }];

      mockTransactionService.findAll.mockResolvedValue(transactions);

      const result = await controller.findAll();

      expect(mockTransactionService.findAll).toHaveBeenCalled();
      expect(result).toEqual(transactions);
    });
  });

  describe('findByInvestment', () => {
    it('should call transactionService.findByInvestment with the correct id', async () => {
      const transactions = [{ id: 'tx1' }];

      mockTransactionService.findByInvestment.mockResolvedValue(transactions);

      const result = await controller.findByInvestment('inv1');

      expect(mockTransactionService.findByInvestment).toHaveBeenCalledWith(
        'inv1',
      );
      expect(result).toEqual(transactions);
    });
  });

  describe('findOne', () => {
    it('should call transactionService.findOne with the correct id', async () => {
      const transaction = { id: 'tx1' };

      mockTransactionService.findOne.mockResolvedValue(transaction);

      const result = await controller.findOne('tx1');

      expect(mockTransactionService.findOne).toHaveBeenCalledWith('tx1');
      expect(result).toEqual(transaction);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      mockTransactionService.findOne.mockRejectedValue(
        new NotFoundException('Transação com ID tx999 não encontrada'),
      );

      await expect(controller.findOne('tx999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should call transactionService.update with the correct id and DTO', async () => {
      const updateDto: UpdateTransactionDto = {
        quantity: 20,
      };

      const updatedTransaction = { id: 'tx1', ...updateDto };

      mockTransactionService.update.mockResolvedValue(updatedTransaction);

      const result = await controller.update('tx1', updateDto);

      expect(mockTransactionService.update).toHaveBeenCalledWith(
        'tx1',
        updateDto,
      );
      expect(result).toEqual(updatedTransaction);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      const updateDto: UpdateTransactionDto = {
        quantity: 20,
      };

      mockTransactionService.update.mockRejectedValue(
        new NotFoundException('Transação com ID tx999 não encontrada'),
      );

      await expect(controller.update('tx999', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should call transactionService.remove with the correct id', async () => {
      const removedTransaction = { id: 'tx1' };

      mockTransactionService.remove.mockResolvedValue(removedTransaction);

      const result = await controller.remove('tx1');

      expect(mockTransactionService.remove).toHaveBeenCalledWith('tx1');
      expect(result).toEqual(removedTransaction);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      mockTransactionService.remove.mockRejectedValue(
        new NotFoundException('Transação com ID tx999 não encontrada'),
      );

      await expect(controller.remove('tx999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
