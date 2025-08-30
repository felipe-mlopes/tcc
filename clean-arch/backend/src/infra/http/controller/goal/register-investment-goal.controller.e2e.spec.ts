import { INestApplication } from "@nestjs/common"
import { Test } from '@nestjs/testing'
import { JwtService } from "@nestjs/jwt"
import request from 'supertest'

import { AppModule } from "@/infra/app.module"
import { DatabaseModule } from "@/infra/database/database.module"
import { PrismaService } from "@/infra/database/prisma/prisma.service"

import { InvestorFactory } from "test/factories/make-investor"

describe('Register Investment Goal (E2E)', () => {
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

    test('[POST] /goal', async () => {
        const investor = await investorFactory.makePrismaInvestor()
        const investorId = investor.id.toValue().toString()
        const accessToken = jwt.sign({ sub: investorId })

        const response = await request(app.getHttpServer())
            .post('/goal')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'Meta 1',
                targetAmount: 100000,
                targetDate: '2027-12-31',
                priority: 'High'
            })

        expect(response.statusCode).toBe(201)
        expect(response.body).toEqual({
            message: 'A meta de investimento foi cadastrada com sucesso',
        })

        const goalOnDatabase = await prisma.goal.findFirst({
            where: {
                investorId
            },
        })

        expect(goalOnDatabase).toBeTruthy()
    })
})