import { Router } from 'express';
import { InvestorController } from '../controllers/investorController';
import { authMiddleware } from '../middleware/auth';
import { validateInvestorData } from '../middleware/validation';

const router = Router();

// Rotas públicas
router.post('/', validateInvestorData, InvestorController.register);
router.post('/auth', InvestorController.authenticate);

// Rotas protegidas
router.patch('/:id', authMiddleware, InvestorController.updateProfile);
router.patch('/:id/deactivate', authMiddleware, InvestorController.deactivateAccount);
router.get('/profile', authMiddleware, InvestorController.getProfile);

export default router;