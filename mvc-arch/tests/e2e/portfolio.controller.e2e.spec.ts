import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { InvestorController } from '@/controllers/investorController';
import { AssetController } from '@/controllers/assetController';
import { PortfolioController } from '@/controllers/portfolioController';
import { randomUUID } from 'crypto';
import { TransactionController } from '@/controllers/transactionController';

type AuthedReq = express.Request & { investor?: { id: string } };
let currentInvestorId = '';
const fakeAuth = (_req: AuthedReq, _res: express.Response, next: express.NextFunction) => {
  (_req as any).investor = { id: currentInvestorId };
  next();
};

function makeApp() {
  const app = express();
  app.use(express.json());
  
  // Rota do investidor (sem auth)
  app.post('/e2e/investors/register', InvestorController.register);
  
  // Rota do ativo (sem auth)
  app.post('/e2e/assets', AssetController.createAsset);

  // Rota do transação (com auth fake)
  app.post('/e2e/transaction/buy/:assetId', fakeAuth, TransactionController.createBuyTransaction)
  
  // Rotas do portfolio (com auth fake)
  app.post('/e2e/portfolios', fakeAuth, PortfolioController.createPortfolio);
  app.post('/e2e/portfolios/investments', fakeAuth, PortfolioController.addInvestment);
  app.patch('/e2e/portfolios/investments/:transactionId', fakeAuth, PortfolioController.updateInvestmentAfterTransaction);
  app.get('/e2e/portfolios/investments/:assetId', fakeAuth, PortfolioController.getInvestmentByAsset);
  app.get('/e2e/portfolios/investments', fakeAuth, PortfolioController.getInvestments);
  app.get('/e2e/portfolios', fakeAuth, PortfolioController.getPortfolios);
  app.get('/e2e/portfolios/:portfolioId', fakeAuth, PortfolioController.getPortfolioById);

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
    email: `e2e-portfolio-${uuid}@tests.dev`,
    name: `E2E Portfolio ${uuid}`,
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
    sector: 'Energy',
    exchange: 'B3',
    currency: 'brl'
  }
};

describe('PortfolioController (E2E)', () => {
  let app: express.Express;

  beforeEach(() => { 
    app = makeApp(); 
    currentInvestorId = '';
  });

  it('POST /e2e/portfolios -> cria portfolio do investidor', async () => {
    const registerRes = await request(app)
      .post('/e2e/investors/register')
      .send(createUniqueInvestor());

    expect(registerRes.status).toBe(201);
    
    const investorId = pickId(registerRes.header, 'investor');
    expect(investorId).toBeTruthy();

    currentInvestorId = investorId as string;

    const res = await request(app)
      .post('/e2e/portfolios')
      .send({ 
        name: 'Carteira 1',
        description: 'Minha primeira carteira'
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const portfolioId = pickId(res.header, 'portfolio');
    expect(portfolioId).toBeTruthy();
  });

  it('POST /e2e/portfolios/investments -> adiciona investimento ao portfolio', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria portfolio
    await request(app).post('/e2e/portfolios').send({ 
      name: 'Carteira Investimentos' 
    });

    // Cria asset
    const assetRes = await request(app).post('/e2e/assets').send(createAsset());
    const assetId = pickId(assetRes.header, 'asset');

    // Adiciona investimento
    const res = await request(app).post('/e2e/portfolios/investments').send({
      assetId: assetId,
      quantity: 100,
      currentPrice: 25.50
    });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('PATCH /e2e/portfolios/investments/:transactionId -> atualiza investimento após transação', async () => {
    // Registra investidor
    const investorRes = await request(app)
      .post('/e2e/investors/register')
      .send(createUniqueInvestor());
    const investorId = pickId(investorRes.header, 'investor');
    
    currentInvestorId = investorId as string;

    // Cria portfolio
    await request(app)
      .post('/e2e/portfolios')
      .send({ 
        name: 'Portfolio para Transação',
        description: 'Portfolio para teste de atualização por transação'
      });

    // Registro ativo
    const assetRes = await request(app)
      .post('/e2e/assets')
      .send(createAsset());
    const assetId = pickId(assetRes.header, 'asset')

    // Adiciona investimento
    await request(app)
      .post('/e2e/portfolios/investments')
      .send({
        assetId: assetId,
        quantity: 100,
        currentPrice: 25.50
      });

    // Cria transação
    const transactionRes = await request(app)
      .post(`/e2e/transaction/buy/${assetId}`)
      .send({
        quantity: 10,
        price: 30,
        fees: 5,
        dateAt: '2025-01-01T00:00:00.000Z'
      })
    const transactionId = pickId(transactionRes.header, 'transaction');

    const res = await request(app)
      .patch(`/e2e/portfolios/investments/${transactionId}`);

    expect(res.status).toBe(200)
    expect(res.body.success).toBeDefined();
  })

  it('GET /e2e/portfolios/investments/:assetId -> retorna investimento específico por asset', async () => {
    // Registra investidor
    const registerRes = await request(app)
      .post('/e2e/investors/register')
      .send(createUniqueInvestor());
    
    const investorId = pickId(registerRes.header, 'investor');
    currentInvestorId = investorId as string;

    // Cria portfolio
    await request(app)
      .post('/e2e/portfolios')
      .send({ 
        name: 'Portfolio com Investimento',
        description: 'Portfolio para teste de busca por asset'
      });

    // Cria asset
    const assetRes = await request(app)
      .post('/e2e/assets')
      .send(createAsset());

    const assetId = pickId(assetRes.header, 'asset');

    // Adiciona investimento
    const addInvestmentRes = await request(app)
      .post('/e2e/portfolios/investments')
      .send({
        assetId: assetId,
        quantity: 50,
        currentPrice: 30.00
      });

    expect(addInvestmentRes.status).toBe(201);

    // Busca investimento por asset
    const res = await request(app).get(`/e2e/portfolios/investments/${assetId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
    expect(res.body.data).toHaveProperty('assetId', assetId);
  })

  it('GET /e2e/portfolios/investments -> retorna investimentos do portfolio com paginação', async () => {
    // Registra investidor
    const registerRes = await request(app)
      .post('/e2e/investors/register')
      .send(createUniqueInvestor());
    
    const investorId = pickId(registerRes.header, 'investor');
    currentInvestorId = investorId as string;

    // Cria portfolio
    await request(app)
      .post('/e2e/portfolios')
      .send({ 
        name: 'Portfolio para Listagem',
        description: 'Portfolio para teste de listagem de investimentos'
      });

    // Adiciona alguns investimentos
    const assets = [
      { symbol: 'PETR4', name: 'Petrobras', type: 'STOCK' },
      { symbol: 'VALE3', name: 'Vale', type: 'STOCK' }
    ];

    for (const asset of assets) {
      // Cria asset
      const assetRes = await request(app)
        .post('/e2e/assets')
        .send(asset);

      const assetId = pickId(assetRes.header, 'asset') || asset.symbol;

      // Adiciona investimento
      await request(app)
        .post('/e2e/portfolios/investments')
        .send({
          assetId: assetId,
          quantity: Math.floor(Math.random() * 100) + 1,
          currentPrice: Math.random() * 100 + 10
        });
    }

    // Testa listagem sem parâmetros (valores padrão)
    const res1 = await request(app).get('/e2e/portfolios/investments');

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data).toBeTruthy();

    // Testa listagem com parâmetros de paginação
    const res2 = await request(app)
      .get('/e2e/portfolios/investments')
      .query({ page: 1, limit: 5 });

    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.data).toBeTruthy();
  })

  it('GET /e2e/portfolios -> lista portfolios do investidor', async () => {
    // Setup: cria investidor e portfolio
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    await request(app).post('/e2e/portfolios').send({ 
      name: 'Carteira Teste' 
    });

    // Testa a listagem
    const res = await request(app).get('/e2e/portfolios');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /e2e/portfolios/:portfolioId -> busca portfolio por ID', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria portfolio
    const createRes = await request(app).post('/e2e/portfolios').send({ 
      name: 'Carteira Específica' 
    });
    
    const portfolioId = pickId(createRes.header, 'portfolio');
    
    // Busca o portfolio criado
    const res = await request(app).get(`/e2e/portfolios/${portfolioId}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
  });
});