import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrismaMock } from '../__mocks__/prismaMock';

vi.mock('@prisma/client', () => {
  const prismaMock = createPrismaMock();

  const toNum = (x: any) => (x && typeof x.toNumber === 'function') ? x.toNumber() : Number(x);

  class MockDecimal {
    readonly n: number;
    constructor(v: any) {
      this.n = toNum(v);
    }
    // conversões
    toNumber() { return this.n; }
    toString() { return String(this.n); }
    toJSON() { return this.n; }
    valueOf() { return this.n; }

    // operações (sinônimos do decimal.js)
    plus(x: any)  { return new MockDecimal(this.n + toNum(x)); }
    add(x: any)   { return this.plus(x); }

    minus(x: any) { return new MockDecimal(this.n - toNum(x)); }
    sub(x: any)   { return this.minus(x); }

    times(x: any) { return new MockDecimal(this.n * toNum(x)); }
    mul(x: any)   { return this.times(x); }

    div(x: any)   { return new MockDecimal(this.n / toNum(x)); }

    // comparações
    lt(x: any)  { return this.n <  toNum(x); }
    lte(x: any) { return this.n <= toNum(x); }
    gt(x: any)  { return this.n >  toNum(x); }
    gte(x: any) { return this.n >= toNum(x); }
    eq(x: any)  { return this.n === toNum(x); }
  }

  return {
    PrismaClient: vi.fn().mockImplementation(() => prismaMock),
    Prisma: { Decimal: MockDecimal },
     __mock: prismaMock
  }
});

import { PortfolioService } from '@/servives/portfolioService';

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

describe('PortfolioService', () => {
  it('createPortfolio: cria e retorna com investor incluso', async () => {
    prismaMock.portfolio.create.mockResolvedValue({
      id: 'p1',
      name: 'Carteira',
      investorId: 'i1',
      investor: { id: 'i1', name: 'Gabi', email: 'gabi@zeta.com' },
    });

    const r = await PortfolioService.createPortfolio('i1', { name: 'Carteira' });
    expect(prismaMock.portfolio.create).toHaveBeenCalled();
    expect(r.id).toBe('p1');
    expect(r.investor?.name).toBe('Gabi');
  });

  it('addInvestment (com portfolioId): exige portfolio existente e usa o MESMO id no investimento', async () => {
    // 1) “cria” (mock) o portfólio
    prismaMock.portfolio.create.mockResolvedValue({
      id: 'pX',
      name: 'Carteira X',
      investorId: '1',
    });
    await PortfolioService.createPortfolio('1', { name: 'Carteira X' });

    // 2) o service vai checar o portfolio informado
    prismaMock.portfolio.findUnique.mockResolvedValue({ id: 'pX', investorId: '1' });
    prismaMock.asset.findUnique.mockResolvedValue({ id: 'a1', symbol: 'PETR4' }); // se houver validação de asset
    prismaMock.investment.findUnique.mockResolvedValue(null);

    // 3) materialização do investimento
    prismaMock.investment.create.mockResolvedValue({
      id: 'inv1',
      portfolioId: 'pX',
      assetId: 'a1',
      quantity: 10,
      totalValue: 50,
    });

    const r = await PortfolioService.addInvestment('1', {
      portfolioId: 'pX',
      assetId: 'a1',
      quantity: 10,
      currentPrice: 5,
    });

    expect(prismaMock.portfolio.findUnique).toHaveBeenCalledWith({ where: { id: 'pX' } });
    expect(prismaMock.investment.create).toHaveBeenCalled();

    const args = prismaMock.investment.create.mock.calls[0][0];
    const usedPortfolioId =
      args?.data?.portfolioId ??
      args?.data?.portfolio?.connect?.id; // cobre FK direta ou connect

    expect(usedPortfolioId).toBe('pX');          // MESMO id do portfolio
    expect(r.portfolioId).toBe('pX');
  });

  it('addInvestment (sem portfolioId): cria antes e usa o PRIMEIRO portfolio do investidor', async () => {
    // 1) “cria” (mock) o portfólio
    prismaMock.portfolio.create.mockResolvedValue({
      id: 'p1',
      name: 'Carteira Default',
      investorId: '1',
    });
    await PortfolioService.createPortfolio('1', { name: 'Carteira Default' });

    // 2) busca o primeiro do investidor
    prismaMock.portfolio.findFirst.mockResolvedValue({ id: 'p1', investorId: '1' });
    prismaMock.asset.findUnique.mockResolvedValue({ id: 'a1', symbol: 'PETR4' });
    prismaMock.investment.findUnique.mockResolvedValue(null);

    // 3) materialização
    prismaMock.investment.create.mockResolvedValue({
      id: 'inv1',
      portfolioId: 'p1',
      assetId: 'a1',
      quantity: 10,
      totalValue: 50,
    });

    const r = await PortfolioService.addInvestment('1', {
      assetId: 'a1',
      quantity: 10,
      currentPrice: 5, // ✅ sem averagePrice
    });

    expect(prismaMock.portfolio.findFirst).toHaveBeenCalledWith({
      where: { investorId: '1' },
      orderBy: { createdAt: 'asc' },
    });
    expect(prismaMock.investment.create).toHaveBeenCalled();

    const args = prismaMock.investment.create.mock.calls[0][0];
    const usedPortfolioId =
      args?.data?.portfolioId ??
      args?.data?.portfolio?.connect?.id;

    expect(usedPortfolioId).toBe('p1'); // MESMO id do portfolio
    expect(r.portfolioId).toBe('p1');
  });
});