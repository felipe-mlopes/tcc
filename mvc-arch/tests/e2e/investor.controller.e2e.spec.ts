import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { InvestorController } from '@/controllers/investorController';

type AuthedReq = express.Request & { investor?: { id: string } };
let currentInvestorId = '';
const fakeAuth = (_req: AuthedReq, _res: express.Response, next: express.NextFunction) => {
  (_req as any).investor = { id: currentInvestorId };
  next();
};

function makeApp() {
  const app = express();
  app.use(express.json());
  app.post('/e2e/investors/register', InvestorController.register);
  app.post('/e2e/investors/auth', InvestorController.authenticate);
  app.get('/e2e/investors/profile', fakeAuth, InvestorController.getProfile);
  app.patch('/e2e/investors/:id', fakeAuth, InvestorController.updateProfile);
  app.patch('/e2e/investors/:id/deactivate', fakeAuth, InvestorController.deactivateAccount);
  return app;
}

const createInvestor = () => ({
    email: 'e2e@tests.dev',
    name: 'E2E',
    cpf: '12398745627',
    dateOfBirth: '1990-01-01',
    password: '#Secret123456',
})

const pickId = (header: any) => {
  const location = header?.location

  if (!location) {
    return null;
  }

  const match = location.match(/\/investor\/([^/?#]+)/i);
  return match ? match[1] : null;
}

describe('InvestorController (E2E)', () => {
  let app: express.Express;
  beforeEach(() => { app = makeApp(); });

  it('POST /e2e/investors/register -> cria investor', async () => {
    const res = await request(app).post('/e2e/investors/register').send(createInvestor());
    
    expect(res.status).toBe(201);

    const id = pickId(res.header);
    expect(id).toBeTruthy();
  });

  it('POST /e2e/investors/auth -> autentica investor', async () => {
    // Primeiro registra um investor
    await request(app).post('/e2e/investors/register').send(createInvestor());
    
    // Depois tenta autenticar
    const res = await request(app).post('/e2e/investors/auth').send({
      email: 'e2e@tests.dev',
      password: '#Secret123456',
    });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /e2e/investors/profile -> retorna perfil do investor', async () => {
    // Primeiro registra um investor
    const registerRes = await request(app).post('/e2e/investors/register').send(createInvestor());
    const investorId = pickId(registerRes.header);
    
    // Define o ID para o middleware fake
    currentInvestorId = investorId as string;
    
    // Busca o perfil
    const res = await request(app).get('/e2e/investors/profile');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
  });

  it('PATCH /e2e/investors/:id -> atualiza perfil do investor', async () => {
    // Primeiro registra um investor
    const registerRes = await request(app).post('/e2e/investors/register').send(createInvestor());
    const investorId = pickId(registerRes.header);
    
    // Define o ID para o middleware fake
    currentInvestorId = investorId as string;
    
    // Atualiza o perfil
    const res = await request(app)
      .patch(`/e2e/investors/${investorId}`)
      .send({
        name: 'Nome Atualizado',
        email: 'novo.email@tests.dev'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('PATCH /e2e/investors/:id/deactivate -> desativa conta do investor', async () => {
    // Primeiro registra um investor
    const registerRes = await request(app).post('/e2e/investors/register').send(createInvestor());
    const investorId = pickId(registerRes.header);
    
    // Define o ID para o middleware fake
    currentInvestorId = investorId as string;
    
    // Desativa a conta
    const res = await request(app).patch(`/e2e/investors/${investorId}/deactivate`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});