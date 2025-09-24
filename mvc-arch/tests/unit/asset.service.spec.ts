import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock } from '../__mocks__/prismaMock';

vi.mock('@prisma/client', () => {
  const prismaMock = createPrismaMock();
  return {
    PrismaClient: vi.fn().mockImplementation(() => prismaMock),
    AssetType: { STOCK: 'STOCK', FUND: 'FUND' },
    __mock: prismaMock,
  };
});

import { AssetService } from '@/servives/assetService';

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

describe('AssetService', () => {
  it('createAsset: uppercases symbol e retorna asset criado', async () => {
    prismaMock.asset.create.mockResolvedValue({
      id: 'a1',
      symbol: 'PETR4',
      name: 'Petrobras',
      assetType: 'STOCK',
      sector: 'Energy',
      exchange: 'B3',
      currency: 'BRL',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await AssetService.createAsset({
      symbol: 'petr4',
      name: 'Petrobras',
      assetType: 'STOCK' as any,
      sector: 'Energy',
      exchange: 'B3',
      currency: 'brl',
    });

    expect(prismaMock.asset.create).toHaveBeenCalled();
    
    const payload = prismaMock.asset.create.mock.calls[0][0].data;
    expect(payload.symbol).toBe('PETR4');
    expect(payload.currency).toBe('BRL');
    expect(res.id).toBe('a1');
  });

  it('searchAssets: retorna paginação e totalPages correto', async () => {
    prismaMock.asset.findMany.mockResolvedValue([
      { id: '1', symbol: 'PETR4', name: 'Petrobras' },
      { id: '2', symbol: 'VALE3', name: 'Vale' },
    ]);
    prismaMock.asset.count.mockResolvedValue(12);

    const res = await AssetService.searchAssets('pet', 2, 2);

    expect(prismaMock.asset.findMany).toHaveBeenCalled();
    expect(prismaMock.asset.count).toHaveBeenCalled();
    expect(res.pagination.page).toBe(2);
    expect(res.pagination.limit).toBe(2);
    expect(res.pagination.total).toBe(12);
    expect(res.pagination.totalPages).toBe(Math.ceil(12 / 2));
    expect(res.assets).toHaveLength(2);
  });
});