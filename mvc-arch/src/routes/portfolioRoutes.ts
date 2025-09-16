import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolioController';
import { authMiddleware } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Todas as rotas de portfolio são protegidas
router.use(authMiddleware);

router.post('/', PortfolioController.createPortfolio);
router.post('/investment/:assetId', PortfolioController.addInvestment);
router.patch('/investment/:transactionId/update', PortfolioController.updateInvestmentAfterTransaction);
router.get('/investment/:assetId', PortfolioController.getInvestmentByAsset);
router.get('/investments', validatePagination, PortfolioController.getInvestments);
router.get('/', PortfolioController.getPortfolios);
router.get('/:portfolioId', PortfolioController.getPortfolioById);

export default router;