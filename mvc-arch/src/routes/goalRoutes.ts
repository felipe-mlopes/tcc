import { Router } from 'express';
import { GoalController } from '../controllers/goalController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Todas as rotas de metas são protegidas
router.use(authMiddleware);

router.post('/', GoalController.createGoal);
router.get('/', GoalController.getGoals);
router.get('/:goalId', GoalController.getGoalById);
router.put('/:goalId', GoalController.updateGoal);
router.delete('/:goalId', GoalController.deleteGoal);
router.patch('/:goalId/achieve', GoalController.markGoalAsAchieved);
router.patch('/:goalId/cancel', GoalController.markGoalAsCancelled);

export default router;