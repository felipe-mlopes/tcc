import { Test, TestingModule } from '@nestjs/testing';

import { GoalPriority, GoalCategory, Prisma } from '@prisma/client';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UpdateGoalProgressDto } from './dto/update-goal-progress.dto';
import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';

// Mock do GoalService
const mockGoalService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  updateProgress: jest.fn(),
  markAsAchieved: jest.fn(),
  calculateGoalProjection: jest.fn(),
};

const mockGoalResponse = {
  id: 'goal-1',
  name: 'Casa Própria',
  description: 'Comprar primeira casa',
  targetAmount: Prisma.Decimal(500000),
  currentAmount: Prisma.Decimal(100000),
  targetDate: new Date('2025-12-31'),
  isAchieved: false,
  priority: GoalPriority.HIGH,
  category: GoalCategory.HOUSE_PURCHASE,
  investorId: 'investor-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  investor: {
    id: 'investor-1',
    name: 'João Silva',
    email: 'joao@email.com',
  },
  progressPercentage: 20,
  remainingAmount: 400000,
  daysRemaining: 365,
  monthlyRequiredContribution: 32876.71,
};

const createGoalDto: CreateGoalDto = {
  name: 'Casa Própria',
  description: 'Comprar primeira casa',
  targetAmount: 500000,
  targetDate: '2025-12-31',
  priority: GoalPriority.HIGH,
  category: GoalCategory.HOUSE_PURCHASE,
  investorId: 'investor-1',
};

const updateGoalDto: UpdateGoalDto = {
  name: 'Casa Própria Atualizada',
  description: 'Comprar primeira casa - atualizado',
};

const updateProgressDto: UpdateGoalProgressDto = {
  currentAmount: 200000,
};

describe('GoalController', () => {
  let controller: GoalController;
  let service: jest.Mocked<GoalService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalController],
      providers: [
        {
          provide: GoalService,
          useValue: mockGoalService,
        },
      ],
    }).compile();

    controller = module.get<GoalController>(GoalController);
    service = module.get(GoalService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a goal', async () => {
      // Arrange
      service.create.mockResolvedValue(mockGoalResponse);

      // Act
      const result = await controller.create(createGoalDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createGoalDto);
      expect(result).toEqual(mockGoalResponse);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Service error');
      service.create.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.create(createGoalDto)).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('findAll', () => {
    it('should return all goals', async () => {
      // Arrange
      service.findAll.mockResolvedValue([mockGoalResponse]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockGoalResponse]);
    });

    it('should return goals filtered by investorId', async () => {
      // Arrange
      const investorId = 'investor-1';
      service.findAll.mockResolvedValue([mockGoalResponse]);

      // Act
      const result = await controller.findAll(investorId);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(investorId);
      expect(result).toEqual([mockGoalResponse]);
    });
  });

  describe('findOne', () => {
    it('should return a goal by id', async () => {
      // Arrange
      service.findOne.mockResolvedValue(mockGoalResponse);

      // Act
      const result = await controller.findOne('goal-1');

      // Assert
      expect(service.findOne).toHaveBeenCalledWith('goal-1');
      expect(result).toEqual(mockGoalResponse);
    });
  });

  describe('update', () => {
    it('should update a goal', async () => {
      // Arrange
      const updatedGoal = {
        ...mockGoalResponse,
        name: updateGoalDto.name!,
        description: updateGoalDto.description!,
        targetAmount: updateGoalDto.targetAmount
          ? new Prisma.Decimal(updateGoalDto.targetAmount)
          : mockGoalResponse.targetAmount,
      };
      service.update.mockResolvedValue(updatedGoal);

      // Act
      const result = await controller.update('goal-1', updateGoalDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith('goal-1', updateGoalDto);
      expect(result).toEqual(updatedGoal);
    });
  });

  describe('remove', () => {
    it('should remove a goal', async () => {
      // Arrange
      service.remove.mockResolvedValue(mockGoalResponse);

      // Act
      const result = await controller.remove('goal-1');

      // Assert
      expect(service.remove).toHaveBeenCalledWith('goal-1');
      expect(result).toEqual(mockGoalResponse);
    });
  });

  describe('updateProgress', () => {
    it('should update goal progress', async () => {
      // Arrange
      const updatedGoal = {
        ...mockGoalResponse,
        currentAmount: Prisma.Decimal(200000),
        progressPercentage: 40,
        remainingAmount: 300000,
      };
      service.updateProgress.mockResolvedValue(updatedGoal);

      // Act
      const result = await controller.updateProgress(
        'goal-1',
        updateProgressDto,
      );

      // Assert
      expect(service.updateProgress).toHaveBeenCalledWith(
        'goal-1',
        updateProgressDto,
      );
      expect(result).toEqual(updatedGoal);
    });
  });

  describe('markAsAchieved', () => {
    it('should mark goal as achieved', async () => {
      // Arrange
      const achievedGoal = {
        ...mockGoalResponse,
        isAchieved: true,
        currentAmount: Prisma.Decimal(500000),
        progressPercentage: 100,
        message: 'Meta marcada como alcançada com sucesso',
      };
      service.markAsAchieved.mockResolvedValue(achievedGoal);

      // Act
      const result = await controller.markAsAchieved('goal-1');

      // Assert
      expect(service.markAsAchieved).toHaveBeenCalledWith('goal-1');
      expect(result).toEqual(achievedGoal);
    });
  });

  describe('calculateProjection', () => {
    it('should calculate goal projection', async () => {
      // Arrange
      const projectionBody = { monthlyContribution: 10000 };
      const projectionResponse = {
        goal: mockGoalResponse,
        projection: {
          projectedCompletionDate: new Date('2028-12-31'),
          monthsToComplete: 40,
          totalContributionsNeeded: 40,
          isAchievableByTargetDate: false,
          recommendedMonthlyContribution: 32876.71,
        },
      };
      service.calculateGoalProjection.mockResolvedValue(projectionResponse);

      // Act
      const result = await controller.calculateProjection(
        'goal-1',
        projectionBody,
      );

      // Assert
      expect(service.calculateGoalProjection).toHaveBeenCalledWith(
        'goal-1',
        projectionBody.monthlyContribution,
      );
      expect(result).toEqual(projectionResponse);
    });
  });
});
