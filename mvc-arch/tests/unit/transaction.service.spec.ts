import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock } from '../__mocks__/prismaMock';

vi.mock('@prisma/client', () => {
  const prismaMock = createPrismaMock();
  return {
    PrismaClient: vi.fn().mockImplementation(() => prismaMock),
    TransactionType: { Buy: 'Buy', Sell: 'Sell', Dividend: 'Dividend' },
    __mock: prismaMock,
  };
});

import { TransactionService } from '@/servives/transactionService';

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

describe('TransactionService', () => {
  it('createBuyTransaction: cria transação e investimento quando não existe', async () => {
    prismaMock.portfolio.findFirst.mockResolvedValue({ id: 'p1', investorId: 'i1' });
    prismaMock.investment.findUnique.mockResolvedValue(null);

    prismaMock.transaction.create.mockResolvedValue({
      id: 't1',
      type: 'Buy',
      assetId: 'a1',
      portfolioId: 'p1',
      quantity: 10,
      price: 5,
      fees: 0,
      dateAt: new Date(),
    });

    prismaMock.investment.create.mockResolvedValue({ id: 'inv1' });
    prismaMock.investment.update.mockResolvedValue({ id: 'inv1' });
    prismaMock.investment.upsert.mockResolvedValue({ id: 'inv1' });

    prismaMock.portfolio.update.mockResolvedValue({ id: 'p1' });

    const r = await TransactionService.createBuyTransaction('i1', {
      assetId: 'a1',
      quantity: 10,
      price: 5,
      fees: 0,
      dateAt: '2025-09-20',
    });

    expect(prismaMock.portfolio.findFirst).toHaveBeenCalled();
    expect(prismaMock.transaction.create).toHaveBeenCalled();

    expect(r.id).toBe('t1');
  });

  it('createSellTransaction: lança erro se quantidade insuficiente', async () => {
    prismaMock.portfolio.findFirst.mockResolvedValue({ id: 'p1', investorId: 'i1' });
    prismaMock.investment.findUnique.mockResolvedValue({ id: 'inv1', quantity: 2, averagePrice: 5 });

    await expect(
      TransactionService.createSellTransaction('i1', {
        assetId: 'a1',
        quantity: 5,
        price: 10,
        fees: 0,
        dateAt: '2025-09-20',
      }),
    ).rejects.toThrow();

    expect(prismaMock.transaction.create).not.toHaveBeenCalled();
  });
});