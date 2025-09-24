import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { InvestorController } from '@/controllers/investorController';
import { GoalController } from '@/controllers/goalController';
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
  
  // Rota do investidor (sem auth)
  app.post('/e2e/investors/register', InvestorController.register);
  
  // Rotas das metas (com auth fake)
  app.post('/e2e/goals', fakeAuth, GoalController.createGoal);
  app.patch('/e2e/goals/:goalId', fakeAuth, GoalController.updateGoal);
  app.get('/e2e/goals/:goalId', fakeAuth, GoalController.getGoalById);
  app.get('/e2e/goals', fakeAuth, GoalController.getGoals);
  app.get('/e2e/goals-progress', fakeAuth, GoalController.getGoalsProgress);
  app.patch('/e2e/goals/:goalId/achieve', fakeAuth, GoalController.markGoalAsAchieved);
  app.patch('/e2e/goals/:goalId/cancel', fakeAuth, GoalController.markGoalAsCancelled);

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
    email: `e2e-goal-${uuid}@tests.dev`,
    name: `E2E Goal ${uuid}`,
    cpf: `${Math.random().toString().slice(2, 13)}`,
    dateOfBirth: '1990-01-01',
    password: '#Secret123456',
  };
};

const createGoal = () => {
  const uuid = randomUUID().slice(0, 4);
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  
  return {
    name: `Meta ${uuid}`,
    description: `Descrição da meta ${uuid}`,
    targetAmount: Math.floor(Math.random() * 50000) + 10000, // Entre 10k e 60k
    targetDate: futureDate.toISOString().split('T')[0],
    priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
  };
};

describe('GoalController (E2E)', () => {
  let app: express.Express;

  beforeEach(() => { 
    app = makeApp(); 
    currentInvestorId = '';
  });

  it('POST /e2e/goals -> cria meta do investidor', async () => {
    const registerRes = await request(app)
      .post('/e2e/investors/register')
      .send(createUniqueInvestor());
    expect(registerRes.status).toBe(201);
    
    const investorId = pickId(registerRes.header, 'investor');
    expect(investorId).toBeTruthy();

    currentInvestorId = investorId as string;

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    const res = await request(app)
      .post('/e2e/goals')
      .send({ 
        name: 'Comprar Casa Própria',
        description: 'Meta para comprar uma casa de 200m²',
        targetAmount: 500000,
        targetDate: futureDate.toISOString().split('T')[0],
        priority: 'High'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/criada/i);

    const goalId = pickId(res.header, 'goal');
    expect(goalId).toBeTruthy();
  });

  it('PATCH /e2e/goals/:goalId -> atualiza meta', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria meta
    const createRes = await request(app).post('/e2e/goals').send(createGoal());
    const goalId = pickId(createRes.header, 'goal');

    // Atualiza a meta
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 3);

    const res = await request(app)
      .patch(`/e2e/goals/${goalId}`)
      .send({
        name: 'Meta Atualizada',
        description: 'Descrição atualizada da meta',
        targetAmount: 75000,
        targetDate: futureDate.toISOString().split('T')[0],
        priority: 'Medium',
        status: 'Active'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/atualizada/i);
  });

  it('GET /e2e/goals/:goalId -> busca meta por ID', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria meta
    const goalData = createGoal();
    const createRes = await request(app).post('/e2e/goals').send(goalData);
    const goalId = pickId(createRes.header, 'goal');

    // Busca a meta criada
    const res = await request(app).get(`/e2e/goals/${goalId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
    expect(res.body.data).toHaveProperty('name', goalData.name);
  });

  it('GET /e2e/goals -> lista metas do investidor sem filtros', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria algumas metas
    const goals = [
      { ...createGoal(), priority: 'High' },
      { ...createGoal(), priority: 'Medium' },
      { ...createGoal(), priority: 'Low' }
    ];

    for (const goal of goals) {
      await request(app).post('/e2e/goals').send(goal);
    }

    // Lista todas as metas
    const res = await request(app).get('/e2e/goals');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3);
  });

  it('GET /e2e/goals -> lista metas com filtros de status e prioridade', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria algumas metas com diferentes prioridades
    const highPriorityGoal = { ...createGoal(), priority: 'High' };
    const mediumPriorityGoal = { ...createGoal(), priority: 'Medium' };

    await request(app).post('/e2e/goals').send(highPriorityGoal);
    await request(app).post('/e2e/goals').send(mediumPriorityGoal);

    // Testa filtro por prioridade
    const res1 = await request(app)
      .get('/e2e/goals')
      .query({ priority: 'High' });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(Array.isArray(res1.body.data)).toBe(true);

    // Testa filtro por status
    const res2 = await request(app)
      .get('/e2e/goals')
      .query({ status: 'Active' });

    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(Array.isArray(res2.body.data)).toBe(true);

    // Testa filtro combinado
    const res3 = await request(app)
      .get('/e2e/goals')
      .query({ 
        status: 'Active',
        priority: 'High'
      });

    expect(res3.status).toBe(200);
    expect(res3.body.success).toBe(true);
    expect(Array.isArray(res3.body.data)).toBe(true);
  });

  it('GET /e2e/goals-progress -> obtém progresso das metas', async () => {
    // Setup: cria investidor
    const investorRes = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    
    const investorId = pickId(investorRes.header, 'investor');
    expect(investorId).toBeTruthy();

    currentInvestorId = investorId as string;
    
    // Cria algumas metas
    await request(app).post('/e2e/goals').send(createGoal());
    await request(app).post('/e2e/goals').send(createGoal());

    // Obtém progresso
    const res = await request(app).get('/e2e/goals-progress');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
  });

  it('PATCH /e2e/goals/:goalId/achieve -> marca meta como alcançada', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria meta
    const createRes = await request(app).post('/e2e/goals').send(createGoal());
    const goalId = pickId(createRes.header, 'goal');

    // Marca como alcançada
    const res = await request(app).patch(`/e2e/goals/${goalId}/achieve`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/alcançada/i);
  });

  it('PATCH /e2e/goals/:goalId/cancel -> marca meta como cancelada', async () => {
    // Setup: cria investidor
    const reg = await request(app).post('/e2e/investors/register').send(createUniqueInvestor());  
    currentInvestorId = pickId(reg.header, 'investor');
    
    // Cria meta
    const createRes = await request(app).post('/e2e/goals').send(createGoal());
    const goalId = pickId(createRes.header, 'goal');

    // Marca como cancelada
    const res = await request(app).patch(`/e2e/goals/${goalId}/cancel`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/cancelada/i);
  });
});