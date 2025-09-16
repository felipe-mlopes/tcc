import { INestApplication } from "@nestjs/common"
import { Test } from '@nestjs/testing'
import request from 'supertest'

import { PrismaService } from "@/infra/database/prisma/prisma.service"
import { AppModule } from "@/infra/app.module"
import { AssetType } from "@prisma/client"

describe('Register Asset (E2E)', () => {
    let app: INestApplication
    let prisma: PrismaService

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule]
        }).compile()

        app = moduleRef.createNestApplication()
        prisma = moduleRef.get(PrismaService)

        await app.init()
    })

    afterAll(async () => {
        await app.close()
    })

    test('[POST] /asset', async () => {
        const response = await request(app.getHttpServer())
            .post('/asset')
            .send({
                symbol: 'PETR4',
                name: 'Ação da Petrobras',
                assetType: AssetType.Stock,
                sector: 'Oil',
                exchange: 'IBOVESPA',
                currency: 'BRL'
            })

        expect(response.statusCode).toBe(201)
        expect(response.body).toEqual({
            message: 'O cadastro do ativo foi realizado com sucesso'
        })

        expect(response.headers.location).toBeDefined()
        expect(response.headers.location).toMatch(/^\/asset\/[a-zA-Z0-9-]+$/)

        const assetOnDatabase = await prisma.asset.findUnique({
            where: {
                symbol: 'PETR4'
            }
        })

        expect(assetOnDatabase).toBeTruthy()
    })
})