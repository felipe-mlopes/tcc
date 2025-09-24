import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authMiddleware } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';

const router = Router();

// Todas as rotas de transação são protegidas
router.use(authMiddleware);

router.post('/buy/:assetId', TransactionController.createBuyTransaction);
router.post('/sell/:assetId', TransactionController.createSellTransaction);
router.post('/dividend/:assetId', TransactionController.createDividendTransaction);
router.get('/:transactionId', TransactionController.getTransactionById);
router.get('/', validatePagination, TransactionController.getTransactions);

export default router;