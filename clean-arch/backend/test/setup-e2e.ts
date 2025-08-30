import { execSync } from "child_process"
import { randomUUID } from "crypto"
import { config } from 'dotenv'

import { PrismaClient } from "@prisma/client"
import { envSchema } from "@/infra/env/env"

config({ path: '.env', override: true })
config({ path: '.env.test', override: true })

const env = envSchema.parse(process.env)

const prisma = new PrismaClient()

function generateUniqueDatabaseURL(schemaId: string) {
  if (!env.DATABASE_URL) {
    throw new Error('Please provider a DATABASE_URL environment variable.')
  }

  const url = new URL(env.DATABASE_URL)

  url.searchParams.set('schema', schemaId)

  return url.toString()
}

const schemaId = randomUUID()
const databaseURL = generateUniqueDatabaseURL(schemaId)

process.env.DATABASE_URL = databaseURL

beforeAll(async () => {
  console.log(`Creating test database schema: ${schemaId}`)
  console.log(`Database URL: ${databaseURL}`)

  execSync('npx prisma db push --force-reset --skip-generate', {
    env: {
      ...process.env,
      DATABASE_URL: databaseURL,
    },
    stdio: 'inherit'
  })
})

afterAll(async () => {
  console.log(`Cleaning up test database schema: ${schemaId}`)

    try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
  } catch (error) {
    console.error('Error dropping schema:', error)
  } finally {
    await prisma.$disconnect()
  }
})