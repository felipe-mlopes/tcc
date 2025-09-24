import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { AssetController } from '@/controllers/assetController';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.post('/e2e/assets', AssetController.createAsset);
  app.get('/e2e/assets/symbol/:symbol', AssetController.getAssetBySymbol);
  app.get('/e2e/assets/:assetId', AssetController.getAssetById);
  app.get('/e2e/assets', AssetController.listAssets);
  return app;
}

const createPayload = () => ({
  symbol: 'petr4',
  name: 'Petrobras',
  assetType: 'Stock',
  sector: 'Energy',
  exchange: 'B3',
  currency: 'brl',
});

const createAnother = () => ({
  symbol: 'itub4',
  name: 'Itaú',
  assetType: 'Stock',
  sector: 'Financials',
  exchange: 'B3',
  currency: 'brl',
});

const pickId = (header: any) => {
  const location = header?.location

  if (!location) {
    return null;
  }

  const match = location.match(/\/asset\/([^/?#]+)/i);
  return match ? match[1] : null;
}

describe('AssetController (E2E)', () => {
  let app: express.Express;
  beforeEach(() => { app = makeApp(); });

  it('POST /e2e/assets -> cria um asset', async () => {
    const res = await request(app).post('/e2e/assets').send(createPayload());

    expect(res.status).toBe(201);

    const id = pickId(res.header);
    expect(id).toBeTruthy();
  });

  it('GET /e2e/assets/symbol/:symbol -> retorna asset por símbolo', async () => {
    await request(app).post('/e2e/assets').send(createPayload()).expect((r) => {
      expect([201]).toContain(r.status);
    });

    const res = await request(app).get('/e2e/assets/symbol/PETR4');
    expect(res.status).toBe(200);

    const name = res.body?.data?.name ?? res.body?.name;
    expect(name).toBe('Petrobras');
  });

  it('GET /e2e/assets/:assetId -> retorna asset por id', async () => {
    const created = await request(app).post('/e2e/assets').send(createPayload());

    const id = pickId(created.header);
    expect(id).toBeTruthy();

    const res = await request(app).get(`/e2e/assets/${id}`);
    expect(res.status).toBe(200);

    const name = res.body?.data?.name ?? res.body?.name;
    expect(name).toBe('Petrobras');
  });

  it('GET /e2e/assets?search=PETR -> lista paginada', async () => {
    await request(app).post('/e2e/assets').send(createPayload()).expect((r) => {
      expect([201]).toContain(r.status);
    });
    await request(app).post('/e2e/assets').send(createAnother()).expect((r) => {
      expect([201]).toContain(r.status);
    });

    const res = await request(app).get('/e2e/assets').query({ search: 'PETR', page: 1, limit: 10 });
    expect(res.status).toBe(200);

    const list = res.body?.data?.assets ?? res.body?.data ?? res.body;
    expect(Array.isArray(list)).toBe(true);

    const symbols = JSON.stringify(list);
    expect(symbols).toContain('PETR4');
  });


});