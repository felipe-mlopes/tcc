import { INestApplication } from "@nestjs/common"
import { Test } from '@nestjs/testing'
import { JwtService } from "@nestjs/jwt"
import request from 'supertest'

import { AppModule } from "@/infra/app.module"
import { DatabaseModule } from "@/infra/database/database.module"
import { InvestorFactory } from "test/factories/make-investor"
import { PrismaService } from "@/infra/database/prisma/prisma.service"
import { Email } from "@/core/value-objects/email"

describe('Deactivate Investor (E2E)', () => {
    let app: INestApplication
    let investorFactory: InvestorFactory
    let prisma: PrismaService
    let jwt: JwtService

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule, DatabaseModule],
            providers: [InvestorFactory]
        }).compile()

        app = moduleRef.createNestApplication()
        investorFactory = moduleRef.get(InvestorFactory)
        prisma = moduleRef.get(PrismaService)
        jwt = moduleRef.get(JwtService)

        await app.init()
    })

    afterAll(async () => {
        await app.close()
    })

    test('[PATCH] /investor/:id/desactive', async () => {
        const investor = await investorFactory.makePrismaInvestor({
            email: Email.create('john-doe@example.com')
        })
        const investorId = investor.id.toValue().toString()
        const accessToken = jwt.sign({ sub: investorId })

        const response = await request(app.getHttpServer())
            .patch(`/investor/${investorId}/desactive`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send()

        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({
            message: 'Investidor desativado com sucesso',
        })

        const investorOnDatabase = await prisma.investor.findUnique({
            where: {
                email: 'john-doe@example.com',
            },
        })

        expect(investorOnDatabase.isActive).toBe(false)
    })
})