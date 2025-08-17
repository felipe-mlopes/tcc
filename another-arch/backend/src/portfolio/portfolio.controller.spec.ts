import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { NotFoundException } from '@nestjs/common';

const mockPortfolioService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  getPortfolioSummary: jest.fn(),
};

describe('PortfolioController', () => {
  let controller: PortfolioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        {
          provide: PortfolioService,
          useValue: mockPortfolioService,
        },
      ],
    }).compile();

    controller = module.get<PortfolioController>(PortfolioController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call portfolioService.create with the correct DTO', async () => {
      const createPortfolioDto: CreatePortfolioDto = {
        name: 'My Test Portfolio',
        investorId: 'investor-1',
      };
      const createdPortfolio = {
        id: 'p1',
        ...createPortfolioDto,
      };
      mockPortfolioService.create.mockResolvedValue(createdPortfolio);

      const result = await controller.create(createPortfolioDto);
      expect(mockPortfolioService.create).toHaveBeenCalledWith(
        createPortfolioDto,
      );
      expect(result).toEqual(createdPortfolio);
    });
  });

  describe('findAll', () => {
    it('should call portfolioService.findAll and return a list of portfolios', async () => {
      const portfolios = [{ id: 'p1' }, { id: 'p2' }];
      mockPortfolioService.findAll.mockResolvedValue(portfolios);

      const result = await controller.findAll();
      expect(mockPortfolioService.findAll).toHaveBeenCalled();
      expect(result).toEqual(portfolios);
    });
  });

  describe('findOne', () => {
    it('should call portfolioService.findOne with the correct id', async () => {
      const portfolio = { id: 'p1' };
      mockPortfolioService.findOne.mockResolvedValue(portfolio);

      const result = await controller.findOne('p1');
      expect(mockPortfolioService.findOne).toHaveBeenCalledWith('p1');
      expect(result).toEqual(portfolio);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      mockPortfolioService.findOne.mockRejectedValue(
        new NotFoundException('Portfolio com ID p999 não encontrado'),
      );

      await expect(controller.findOne('p999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPortfolioSummary', () => {
    it('should call portfolioService.getPortfolioSummary with the correct id', async () => {
      const summary = {
        totalInvested: 1000,
        totalAssets: 2,
        assetDistribution: [],
      };
      mockPortfolioService.getPortfolioSummary.mockResolvedValue(summary);

      const result = await controller.getPortfolioSummary('p1');
      expect(mockPortfolioService.getPortfolioSummary).toHaveBeenCalledWith(
        'p1',
      );
      expect(result).toEqual(summary);
    });

    it('should throw NotFoundException if service throws NotFoundException', async () => {
      mockPortfolioService.getPortfolioSummary.mockRejectedValue(
        new NotFoundException('Portfolio com ID p999 não encontrado'),
      );

      await expect(controller.getPortfolioSummary('p999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
