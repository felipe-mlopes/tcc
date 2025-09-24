import { vi } from 'vitest';

export function createPrismaMock() {
  const mock = {
    asset: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    investor: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    goal: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    portfolio: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    investment: {
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      aggregate: vi.fn(),
    },
    // 👇 MUITO IMPORTANTE: passar o "tx" para o callback!
    $transaction: vi.fn(async (cb: any) => cb(mock)),
  };

  return mock;
}