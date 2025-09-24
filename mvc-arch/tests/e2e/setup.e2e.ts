import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Carrega variáveis (ordem: .env → .env.test)
loadEnv({ path: '.env', override: true });
loadEnv({ path: '.env.test', override: true });

// Prisma compartilhado + estado do schema
let prisma: PrismaClient;
let schemaId: string;
let testDatabaseURL: string;

function generateUniqueDatabaseURL(baseUrl: string, schema: string) {
  const url = new URL(baseUrl);
  url.searchParams.set('schema', schema);
  return url.toString();
}

beforeAll(async () => {
  const base = process.env.DATABASE_URL;
  if (!base) {
    throw new Error('DATABASE_URL não definido. Configure em .env/.env.test');
  }

  schemaId = randomUUID(); // ex.: '1b2c3d...'
  testDatabaseURL = generateUniqueDatabaseURL(base, schemaId);

  // Disponibiliza para tudo que for importado depois
  process.env.DATABASE_URL = testDatabaseURL;

  // Cria cliente Prisma apontando para o schema efêmero
  prisma = new PrismaClient({
    datasources: { db: { url: testDatabaseURL } },
  });

  // Sobe o schema (força reset, sem gerar client)
  execSync('npx prisma db push --force-reset --skip-generate', {
    env: { ...process.env, DATABASE_URL: testDatabaseURL },
    stdio: 'inherit',
  });
}, 120_000);

// Limpa dados entre os testes (TRUNCATE todas as tabelas do schema)
afterEach(async () => {
  if (!prisma) return;

  // lista tabelas do schema
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = ${schemaId}
  `;

  // TRUNCATE CASCADE em todas (menos migrações)
  for (const { tablename } of tables) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${schemaId}"."${tablename}" CASCADE`);
    }
  }
});

// Dropa o schema no final
afterAll(async () => {
  if (prisma) {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`);
    await prisma.$disconnect();
  }
}, 120_000);

// (opcional) exportar o prisma para inspeção nos testes
export { prisma as testPrisma };