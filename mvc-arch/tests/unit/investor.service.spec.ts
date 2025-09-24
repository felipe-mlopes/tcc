import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock } from '../__mocks__/prismaMock';

vi.mock('@prisma/client', () => {
  const prismaMock = createPrismaMock();
  return {
    PrismaClient: vi.fn().mockImplementation(() => prismaMock),
    __mock: prismaMock,
  };
});

const ids = vi.hoisted(() => {
  const path = require('node:path');
  return {
    encryption: path.resolve(process.cwd(), 'src/utils/encryption'),
    jwt: path.resolve(process.cwd(), 'src/utils/jwt'),
  };
});

vi.mock(ids.encryption, () => ({
  EncryptionUtil: {
    hashPassword: vi.fn(async (pwd: string) => `hashed:${pwd}`),
    comparePassword: vi.fn(async () => true),
  },
}));

vi.mock(ids.jwt, () => ({
  JWTUtil: {
    generateToken: vi.fn(() => 'jwt-token'),
    verifyToken: vi.fn(() => ({ id: 'i1' })),
  },
}));

import { InvestorService } from '@/servives/investorService';

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

describe('InvestorService.createInvestor', () => {
  it('hashea a senha, cria o investor e não devolve password', async () => {
    const created = {
      id: 'i1',
      email: 'gabi@zeta.com',
      name: 'Gabi',
      cpf: '123',
      dateOfBirth: '1990-01-01',
      profile: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.investor.create.mockResolvedValue(created);

    const r = await InvestorService.createInvestor({
      email: 'gabi@zeta.com',
      name: 'Gabi',
      cpf: '123',
      dateOfBirth: '1990-01-01',
      password: 'abc123',
    });

    expect(prismaMock.investor.create).toHaveBeenCalled();
    const payload = prismaMock.investor.create.mock.calls[0][0];

    expect(payload.data.password).toBe('hashed:abc123');

    expect(r).toEqual(created);
    expect((r as any).password).toBeUndefined();
  });
});