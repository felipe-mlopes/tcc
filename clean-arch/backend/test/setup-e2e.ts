import { execSync } from "child_process"
import { randomUUID } from "crypto"
import { config } from 'dotenv'

import { PrismaClient } from "@prisma/client"
import { envSchema } from "@/infra/env/env"

config({ path: '.env', override: true })
config({ path: '.env.test', override: true })

const env = envSchema.parse(process.env)

// Cliente Prisma compartilhado
let prisma: PrismaClient
let testDatabaseURL: string
let schemaId: string

function generateUniqueDatabaseURL(schemaId: string) {
  if (!env.DATABASE_URL) {
    throw new Error('Please provider a DATABASE_URL environment variable.')
  }

  const url = new URL(env.DATABASE_URL)
  url.searchParams.set('schema', schemaId)
  return url.toString()
}

beforeAll(async () => {
  // Gerar um único schema para toda a suíte de testes E2E
  schemaId = randomUUID()
  testDatabaseURL = generateUniqueDatabaseURL(schemaId)

  // Definir a URL do banco para todos os testes
  process.env.DATABASE_URL = testDatabaseURL

  console.log(`🚀 Setting up E2E test database schema: ${schemaId}`)
  console.log(`📦 Database URL: ${testDatabaseURL}`)

  // Criar o cliente Prisma
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: testDatabaseURL
      }
    }
  })

  // Executar migrations/push apenas uma vez
  execSync('npx prisma db push --force-reset --skip-generate', {
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseURL,
    },
    stdio: 'inherit'
  })

  console.log(`✅ E2E test database ready!`)
}, 6000) // Timeout maior para setup

// Cleanup entre cada teste individual
afterEach(async () => {
  if (prisma) {
    // Limpar dados sem dropar o schema
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = ${schemaId}
    `
    
    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${schemaId}"."${tablename}" CASCADE`)
      }
    }
  }
})

// Cleanup global - executa apenas uma vez no final de todos os testes E2E
afterAll(async () => {
  console.log(`🧹 Cleaning up E2E test database schema: ${schemaId}`)

  try {
    if (prisma) {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
      await prisma.$disconnect()
    }
    console.log(`✅ E2E test database cleaned up!`)
  } catch (error) {
    console.error('❌ Error dropping schema:', error)
  }
}, 30000) // Timeout para cleanup

// Exportar o cliente Prisma para uso nos testes
export { prisma as testPrisma }