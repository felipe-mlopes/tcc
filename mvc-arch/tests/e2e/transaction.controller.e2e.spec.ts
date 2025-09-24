import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { InvestorController } from '@/controllers/investorController';
import { AssetController } from '@/controllers/assetController';
import { PortfolioController } from '@/controllers/portfolioController';
import { TransactionController } from '@/controllers/transactionController';
import { randomUUID } from 'crypto';

type AuthedReq = express.Request & { investor?: { id: string } };
let currentInvestorId = '';
const fakeAuth = (_req: AuthedReq, _res: express.Response, next: express.NextFunction) => {
  (_req as any).investor = { id: currentInvestorId };
  next();
};

function makeApp() {
  const app = express();
  app.use(express.json());

  // Rotas do investidor (sem auth)
  app.post('/e2e/investors/register', InvestorController.register);
  
  // Rotas do ativo (sem auth)
  app.post('/e2e/assets', AssetController.createAsset);

  // Rotas do portfolio (com auth fake)
  app.post('/e2e/portfolios', fakeAuth, PortfolioController.createPortfolio);
  app.post('/e2e/portfolios/investments', fakeAuth, PortfolioController.addInvestment);

  // Rotas das transações (com auth fake)
  app.post('/e2e/transactions/buy/:assetId', fakeAuth, TransactionController.createBuyTransaction);
  app.post('/e2e/transactions/sell/:assetId', fakeAuth, TransactionController.createSellTransaction);
  app.post('/e2e/transactions/dividend/:assetId', fakeAuth, TransactionController.createDividendTransaction);
  app.patch('/e2e/transactions/:transactionId', fakeAuth, TransactionController.updateTransaction);
  app.get('/e2e/transactions/asset/:assetId', fakeAuth, TransactionController.getTransactionsByAsset);
  app.get('/e2e/transactions', fakeAuth, TransactionController.getTransactions);
  app.get('/e2e/transactions/:transactionId', fakeAuth, TransactionController.getTransactionById);

  return app;
}

const pickId = (header: any, route: string) => {
  const location = header?.location

  if (!location) {
    return null;
  }

  const patterns = [
    new RegExp(`\\/${route}\\/([^/?#]+)`, 'i'),  // /route/id
    new RegExp(`${route}\\/([^/?#]+)`, 'i'),     // route/id (sem barra inicial)
    new RegExp(`\\/${route}s?\\/([^/?#]+)`, 'i'), // /route/id ou /routes/id
  ];

  for (const regex of patterns) {
    const match = location.match(regex);
    if (match) {
      return match[1];
    }
  }

  return null;
}

const createUniqueInvestor = () => {
  const uuid = randomUUID().slice(0, 8);
  return {
    email: `e2e-transaction-${uuid}@tests.dev`,
    name: `E2E Transaction ${uuid}`,
    cpf: `${Math.random().toString().slice(2, 13)}`,
    dateOfBirth: '1990-01-01',
    password: '#Secret123456',
  };
};

const createAsset = () => {
  const uuid = randomUUID().slice(0, 4).toUpperCase();
  return {
    symbol: `TST${uuid}`,
    name: `Test Asset ${uuid}`,
    assetType: 'Stock',
    sector: 'Technology',
    exchange: 'B3',
    currency: 'brl'
  }
};

describe('TransactionController (E2E)', () => {
  let app: express.Express;

  beforeEach(() => { 
    app = makeApp(); 
    currentInvestorId = '';
  });

  it('POST /e2e/transactions/buy/:assetId -> cria transação de compra', async () => {
    // Setup: cria investidor
    const registerRes = await request(app)
      .post('/e2e/investors/register')
      .send(createUniqueInvestor());

    expect(registerRes.status).toBe(201);
    
    const investorId = pickId(registerRes.header, 'investor');
    expect(investorId).toBeTruthy();

    currentInvestorId = investorId as string;

    // Cria portfolio
    await request(app).post('/e2e/portfolios').send({ 
      name: 'Carteira Transações' 
    });

    // Cria asset
    const assetRes = await request(app).post('/e2e/assets').send(createAsset());
    const assetId = pickId(assetRes.header, 'asset');

    // Adiciona investimento inicial
    await request(app).post('/e2e/portfolios/investments').send({
      assetId: assetId,
      quantity: 100,
      currentPrice: 25.50
    });

    // Cria transação de compra
    const res = await request(app)
      .post(`/e2e/transactions/buy/${assetId}`)
      .send({
        quantity: 50,
        price: 30.00,
        fees: 2.50,
        dateAt: '2025-09-20T10:00:00.000Z'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/compra/i);

    const transactionId = pickId(res.header, 'transaction');
    expect(transactionId).toBeTruthy();
  });

  it('POST /e2e/transactions/sell/:assetId -> cria transação de venda', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria portfolio
    await request(app).post('/e2e/portfolios').send({ 
      name: 'Carteira Venda' 
    });

    // Cria asset
    const assetRes = await request(app).post('/e2e/assets').send(createAsset());
    const assetId = pickId(assetRes.header, 'asset');

    // Adiciona investimento inicial com quantidade suficiente
    await request(app).post('/e2e/portfolios/investments').send({
      assetId: assetId,
      quantity: 100,
      currentPrice: 25.50
    });

    // Cria transação de venda
    const res = await request(app)
      .post(`/e2e/transactions/sell/${assetId}`)
      .send({
        quantity: 30,
        price: 28.00,
        fees: 1.50,
        dateAt: '2025-09-21T14:30:00.000Z'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/venda/i);

    const transactionId = pickId(res.header, 'transaction');
    expect(transactionId).toBeTruthy();
  });

  it('POST /e2e/transactions/dividend/:assetId -> cria transação de dividendo', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria portfolio
    await request(app).post('/e2e/portfolios').send({ 
      name: 'Carteira Dividendos' 
    });

    // Cria asset
    const assetRes = await request(app).post('/e2e/assets').send(createAsset());
    const assetId = pickId(assetRes.header, 'asset');

    // Adiciona investimento inicial
    await request(app).post('/e2e/portfolios/investments').send({
      assetId: assetId,
      quantity: 100,
      currentPrice: 25.50
    });

    // Cria transação de dividendo
    const res = await request(app)
      .post(`/e2e/transactions/dividend/${assetId}`)
      .send({
        quantity: 100,
        price: 25.50,
        income: 150.00,
        dateAt: '2025-09-15T00:00:00.000Z'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/dividendo/i);

    const transactionId = pickId(res.header, 'transaction');
    expect(transactionId).toBeTruthy();
  });

  it('PATCH /e2e/transactions/:transactionId -> atualiza transação', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria portfolio
    await request(app).post('/e2e/portfolios').send({ 
      name: 'Carteira Update' 
    });

    // Cria asset
    const assetRes = await request(app).post('/e2e/assets').send(createAsset());
    const assetId = pickId(assetRes.header, 'asset');

    // Adiciona investimento inicial
    await request(app).post('/e2e/portfolios/investments').send({
      assetId: assetId,
      quantity: 100,
      currentPrice: 25.50
    });

    // Cria transação
    const createRes = await request(app)
      .post(`/e2e/transactions/buy/${assetId}`)
      .send({
        quantity: 50,
        price: 30.00,
        fees: 2.50,
        dateAt: '2025-09-20T10:00:00.000Z'
      });

    const transactionId = pickId(createRes.header, 'transaction');

    // Atualiza a transação
    const res = await request(app)
      .patch(`/e2e/transactions/${transactionId}`)
      .send({
        quantity: 60,
        price: 32.00,
        fees: 3.00
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/atualizada/i);
  });

  it('GET /e2e/transactions/asset/:assetId -> lista transações por asset', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria portfolio
    await request(app).post('/e2e/portfolios').send({ 
      name: 'Carteira Asset Transactions' 
    });

    // Cria asset
    const assetRes = await request(app).post('/e2e/assets').send(createAsset());
    const assetId = pickId(assetRes.header, 'asset');

    // Adiciona investimento inicial
    await request(app).post('/e2e/portfolios/investments').send({
      assetId: assetId,
      quantity: 200,
      currentPrice: 25.50
    });

    // Cria algumas transações
    await request(app)
      .post(`/e2e/transactions/buy/${assetId}`)
      .send({
        quantity: 50,
        price: 30.00,
        fees: 2.50,
        dateAt: '2025-09-20T10:00:00.000Z'
      });

    await request(app)
      .post(`/e2e/transactions/sell/${assetId}`)
      .send({
        quantity: 25,
        price: 32.00,
        fees: 1.50,
        dateAt: '2025-09-21T15:00:00.000Z'
      });

    // Lista transações por asset
    const res = await request(app)
      .get(`/e2e/transactions/asset/${assetId}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
  });

  it('GET /e2e/transactions -> lista todas as transações com paginação', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria portfolio
    await request(app).post('/e2e/portfolios').send({ 
      name: 'Carteira All Transactions' 
    });

    // Cria múltiplos assets e transações
    const assets = [];
    for (let i = 0; i < 3; i++) {
      const assetRes = await request(app).post('/e2e/assets').send(createAsset());
      const assetId = pickId(assetRes.header, 'asset');
      assets.push(assetId);

      // Adiciona investimento inicial
      await request(app).post('/e2e/portfolios/investments').send({
        assetId: assetId,
        quantity: 100,
        currentPrice: 25.50 + i
      });

      // Cria transação de compra
      await request(app)
        .post(`/e2e/transactions/buy/${assetId}`)
        .send({
          quantity: 25 + i * 5,
          price: 30.00 + i,
          fees: 2.00,
          dateAt: `2025-09-2${i + 1}T10:00:00.000Z`
        });
    }

    // Lista todas as transações
    const res = await request(app)
      .get('/e2e/transactions')
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
    expect(res.body.data.transactions).toBeDefined();
    expect(Array.isArray(res.body.data.transactions)).toBe(true);
  });

  it('GET /e2e/transactions/:transactionId -> busca transação por ID', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria portfolio
    await request(app).post('/e2e/portfolios').send({ 
      name: 'Carteira Get Transaction' 
    });

    // Cria asset
    const assetRes = await request(app).post('/e2e/assets').send(createAsset());
    const assetId = pickId(assetRes.header, 'asset');

    // Adiciona investimento inicial
    await request(app).post('/e2e/portfolios/investments').send({
      assetId: assetId,
      quantity: 100,
      currentPrice: 25.50
    });

    // Cria transação
    const createRes = await request(app)
      .post(`/e2e/transactions/buy/${assetId}`)
      .send({
        quantity: 50,
        price: 30.00,
        fees: 2.50,
        dateAt: '2025-09-20T10:00:00.000Z'
      });

    const transactionId = pickId(createRes.header, 'transaction');

    // Busca a transação criada
    const res = await request(app).get(`/e2e/transactions/${transactionId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
  });
});