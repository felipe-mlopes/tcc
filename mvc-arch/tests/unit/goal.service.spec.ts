import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock } from '../__mocks__/prismaMock';

vi.mock('@prisma/client', () => {
  const prismaMock = createPrismaMock();
  return  {
    PrismaClient: vi.fn().mockImplementation(() => prismaMock),
    Status: { Achieved: 'Achieved', Cancelled: 'Cancelled' },
    Priority: { Low: 'Low', Medium: 'Medium', High: 'High' },
    __mock: prismaMock,
  }
});

import { GoalService } from '@/servives/goalService';

let prismaMock: any;

function resetDeepMocks(obj: any) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === 'object') {
      if (typeof v.mockReset === 'function') v.mockReset();
      else resetDeepMocks(v);
    }
  }
}

beforeEach(async () => {
  const prismaModule: any = await import('@prisma/client');
  prismaMock = prismaModule.__mock;
  resetDeepMocks(prismaMock);
  vi.clearAllMocks();
});

describe('GoalService', () => {
  it('getGoalsProgress: soma valor total dos portfolios e calcula progresso', async () => {
    const today = new Date();
    const in5days = new Date(today.getTime() + 5 * 86400000);

    prismaMock.goal.findMany.mockResolvedValue([
      { id: 'g1', investorId: 'i1', name: 'Meta', targetAmount: 1000, targetDate: in5days, status: 'InProgress', priority: 'High', createdAt: today, updatedAt: today },
    ]);

    // portfolios -> investments.totalValue
    prismaMock.portfolio.findMany.mockResolvedValue([
      {
        id: 'p1',
        investments: [
          { totalValue: 400 },
          { totalValue: 200 },
        ],
      },
    ]);

    const res = await GoalService.getGoalsProgress('i1');

    expect(prismaMock.goal.findMany).toHaveBeenCalled();
    expect(prismaMock.portfolio.findMany).toHaveBeenCalled();

    expect(res[0].currentValue).toBe(600);
    expect(res[0].progress).toBeCloseTo(60, 1);
    expect(res[0].remainingAmount).toBe(400);
    expect(res[0].isOverdue).toBe(false);
  });

  it('markGoalAsAchieved: delega para updateGoal com Status.Achieved', async () => {
    const spy = vi.spyOn(GoalService as any, 'updateGoal').mockResolvedValue({ id: 'g1', status: 'Achieved' });
    const r = await GoalService.markGoalAsAchieved('i1', 'g1');
    expect(spy).toHaveBeenCalledWith('i1', 'g1', { status: 'Achieved' });
    expect(r.status).toBe('Achieved');
  });
});