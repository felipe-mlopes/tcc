import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GoalPriority, GoalCategory, Prisma } from '@prisma/client';
import { GoalService } from './goal.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock data
const mockInvestor = {
  id: 'investor-1',
  name: 'João Silva',
  email: 'joao@email.com',
  cpf: '12345678901',
  dateOfBirth: new Date('1990-01-01'),
  phone: '11999999999',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockGoal = {
  id: 'goal-1',
  name: 'Casa Própria',
  description: 'Comprar primeira casa',
  targetAmount: new Prisma.Decimal(500000),
  currentAmount: new Prisma.Decimal(100000),
  targetDate: new Date('2025-12-31'),
  isAchieved: false,
  priority: GoalPriority.HIGH,
  category: GoalCategory.HOUSE_PURCHASE,
  investorId: 'investor-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createEnrichedGoal = (overrides = {}) => ({
  ...mockGoal,
  progressPercentage: 20,
  remainingAmount: 400000,
  daysRemaining: 365,
  monthlyRequiredContribution: 32876.71,
  ...overrides,
});

const createGoalDto = {
  name: 'Casa Própria',
  description: 'Comprar primeira casa',
  targetAmount: 500000,
  targetDate: '2025-12-31',
  priority: GoalPriority.HIGH,
  category: GoalCategory.HOUSE_PURCHASE,
  investorId: 'investor-1',
};

const updateGoalDto = {
  name: 'Casa Própria Atualizada',
  description: 'Comprar primeira casa - atualizado',
};

describe('GoalService', () => {
  let service: GoalService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<GoalService>(GoalService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a goal successfully', async () => {
      // Arrange
      prisma.investor.findUnique.mockResolvedValue(mockInvestor);
      prisma.goal.create.mockResolvedValue(mockGoal);

      // Act
      const result = await service.create(createGoalDto);

      // Assert
      expect(prisma.investor.findUnique).toHaveBeenCalledWith({
        where: { id: createGoalDto.investorId },
      });
      expect(prisma.goal.create).toHaveBeenCalledWith({
        data: {
          name: createGoalDto.name,
          description: createGoalDto.description,
          targetAmount: createGoalDto.targetAmount,
          targetDate: new Date(createGoalDto.targetDate),
          priority: createGoalDto.priority,
          category: createGoalDto.category,
          investorId: createGoalDto.investorId,
        },
      });
      expect(result).toBeDefined();
      expect(result.progressPercentage).toBe(20); // 100000/500000 * 100
    });

    it('should throw NotFoundException when investor not found', async () => {
      // Arrange
      prisma.investor.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createGoalDto)).rejects.toThrow(
        new NotFoundException('Investidor não encontrado'),
      );
    });

    it('should throw BadRequestException when target date is in the past', async () => {
      // Arrange
      const pastDate = '2020-01-01';
      const createGoalDtoWithPastDate = {
        ...createGoalDto,
        targetDate: pastDate,
      };
      prisma.investor.findUnique.mockResolvedValue(mockInvestor);

      // Act & Assert
      await expect(service.create(createGoalDtoWithPastDate)).rejects.toThrow(
        new BadRequestException('Data alvo deve ser futura'),
      );
    });

    it('should handle Prisma P2003 error (foreign key constraint)', async () => {
      // Arrange
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '4.0.0',
        },
      );
      prisma.investor.findUnique.mockResolvedValue(mockInvestor);
      prisma.goal.create.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.create(createGoalDto)).rejects.toThrow(
        new NotFoundException('Investidor não encontrado'),
      );
    });
  });

  describe('findAll', () => {
    it('should return all goals', async () => {
      // Arrange
      prisma.goal.findMany.mockResolvedValue([mockGoal]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: {
          investor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { isAchieved: 'asc' },
          { priority: 'desc' },
          { targetDate: 'asc' },
        ],
      });
      expect(result).toEqual([mockGoal]);
    });

    it('should return goals filtered by investorId', async () => {
      // Arrange
      const investorId = 'investor-1';
      prisma.goal.findMany.mockResolvedValue([mockGoal]);

      // Act
      const result = await service.findAll(investorId);

      // Assert
      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        where: { investorId },
        include: {
          investor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { isAchieved: 'asc' },
          { priority: 'desc' },
          { targetDate: 'asc' },
        ],
      });
      expect(result).toEqual([mockGoal]);
    });
  });

  describe('findOne', () => {
    it('should return a goal by id', async () => {
      // Arrange
      prisma.goal.findUnique.mockResolvedValue(mockGoal);

      // Act
      const result = await service.findOne('goal-1');

      // Assert
      expect(prisma.goal.findUnique).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        include: {
          investor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toBeDefined();
      expect(result.progressPercentage).toBe(20);
    });

    it('should throw NotFoundException when goal not found', async () => {
      // Arrange
      prisma.goal.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        new NotFoundException('Meta não encontrada'),
      );
    });
  });

  describe('update', () => {
    it('should update a goal successfully', async () => {
      // Arrange
      prisma.goal.findUnique.mockResolvedValue(mockGoal);
      prisma.goal.update.mockResolvedValue({ ...mockGoal, ...updateGoalDto });

      // Act
      const result = await service.update('goal-1', updateGoalDto);

      // Assert
      expect(prisma.goal.findUnique).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
      });
      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: updateGoalDto,
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when goal not found', async () => {
      // Arrange
      prisma.goal.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('nonexistent-id', updateGoalDto),
      ).rejects.toThrow(new NotFoundException('Meta não encontrada'));
    });

    it('should throw BadRequestException when trying to update achieved goal', async () => {
      // Arrange
      const achievedGoal = { ...mockGoal, isAchieved: true };
      prisma.goal.findUnique.mockResolvedValue(achievedGoal);

      // Act & Assert
      await expect(service.update('goal-1', updateGoalDto)).rejects.toThrow(
        new BadRequestException('Não é possível editar meta já alcançada'),
      );
    });

    it('should handle Prisma P2025 error', async () => {
      // Arrange
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );
      prisma.goal.findUnique.mockResolvedValue(mockGoal);
      prisma.goal.update.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.update('goal-1', updateGoalDto)).rejects.toThrow(
        new NotFoundException('Meta não encontrada'),
      );
    });
  });

  describe('remove', () => {
    it('should delete a goal successfully', async () => {
      // Arrange
      prisma.goal.delete.mockResolvedValue(mockGoal);

      // Act
      const result = await service.remove('goal-1');

      // Assert
      expect(prisma.goal.delete).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
      });
      expect(result).toEqual(mockGoal);
    });

    it('should handle Prisma P2025 error', async () => {
      // Arrange
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        },
      );
      prisma.goal.delete.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        new NotFoundException('Meta não encontrada'),
      );
    });
  });

  describe('updateProgress', () => {
    it('should update goal progress successfully', async () => {
      // Arrange
      const updateProgressDto = { currentAmount: 200000 };
      const updatedGoal = {
        ...mockGoal,
        currentAmount: new Prisma.Decimal(200000),
      };

      prisma.goal.findUnique.mockResolvedValue(mockGoal);
      prisma.goal.update.mockResolvedValue(updatedGoal);

      // Act
      const result = await service.updateProgress('goal-1', updateProgressDto);

      // Assert
      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: {
          currentAmount: 200000,
          isAchieved: false,
        },
      });
      expect(result).toBeDefined();
      expect(result.progressPercentage).toBe(40); // 200000/500000 * 100
    });

    it('should mark goal as achieved when current amount reaches target', async () => {
      // Arrange
      const updateProgressDto = { currentAmount: 500000 };
      const updatedGoal = {
        ...mockGoal,
        currentAmount: new Prisma.Decimal(500000),
        isAchieved: true,
      };

      prisma.goal.findUnique.mockResolvedValue(mockGoal);
      prisma.goal.update.mockResolvedValue(updatedGoal);

      // Act
      const result = await service.updateProgress('goal-1', updateProgressDto);

      // Assert
      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: {
          currentAmount: 500000,
          isAchieved: true,
          updatedAt: expect.any(Date) as Date,
        },
      });
      expect(result.progressPercentage).toBe(100);
    });
  });

  describe('markAsAchieved', () => {
    it('should mark goal as achieved successfully', async () => {
      // Arrange
      const achievedGoal = {
        ...mockGoal,
        isAchieved: true,
        currentAmount: mockGoal.targetAmount,
      };

      prisma.goal.findUnique.mockResolvedValue(mockGoal);
      prisma.goal.update.mockResolvedValue(achievedGoal);

      // Act
      const result = await service.markAsAchieved('goal-1');

      // Assert
      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: {
          isAchieved: true,
          currentAmount: mockGoal.targetAmount,
        },
      });
      expect(result.message).toBe('Meta marcada como alcançada com sucesso');
    });

    it('should throw BadRequestException when goal is already achieved', async () => {
      // Arrange
      const achievedGoal = { ...mockGoal, isAchieved: true };
      prisma.goal.findUnique.mockResolvedValue(achievedGoal);

      // Act & Assert
      await expect(service.markAsAchieved('goal-1')).rejects.toThrow(
        new BadRequestException('Meta já foi alcançada'),
      );
    });
  });

  describe('calculateGoalProjection', () => {
    it('should calculate goal projection successfully', async () => {
      // Arrange
      const monthlyContribution = 10000;
      const goalWithProgress = createEnrichedGoal();

      jest.spyOn(service, 'findOne').mockResolvedValue(goalWithProgress);

      // Act
      const result = await service.calculateGoalProjection(
        'goal-1',
        monthlyContribution,
      );

      // Assert
      expect(result.goal).toEqual(goalWithProgress);
      expect(result.projection.monthsToComplete).toBe(40); // 400000/10000
      expect(result.projection.isAchievableByTargetDate).toBe(false);
      expect(result.projection.recommendedMonthlyContribution).toBeGreaterThan(
        0,
      );
    });

    it('should throw BadRequestException when goal is already achieved', async () => {
      // Arrange
      const achievedGoal = createEnrichedGoal({
        isAchieved: true,
        progressPercentage: 100,
        remainingAmount: 0,
        monthlyRequiredContribution: 0,
      });
      jest.spyOn(service, 'findOne').mockResolvedValue(achievedGoal);

      // Act & Assert
      await expect(
        service.calculateGoalProjection('goal-1', 10000),
      ).rejects.toThrow(new BadRequestException('Meta já foi alcançada'));
    });

    it('should throw BadRequestException when monthly contribution is invalid', async () => {
      // Arrange
      const goalWithProgress = createEnrichedGoal();
      jest.spyOn(service, 'findOne').mockResolvedValue(goalWithProgress);

      // Act & Assert
      await expect(
        service.calculateGoalProjection('goal-1', 0),
      ).rejects.toThrow(
        new BadRequestException('Contribuição mensal deve ser positiva'),
      );
    });
  });
});
