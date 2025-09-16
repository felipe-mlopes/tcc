import { INestApplication } from "@nestjs/common"
import { Test } from '@nestjs/testing'
import { JwtService } from "@nestjs/jwt"
import request from 'supertest'

import { AppModule } from "@/infra/app.module"
import { DatabaseModule } from "@/infra/database/database.module"
import { PrismaService } from "@/infra/database/prisma/prisma.service"

import { InvestorFactory } from "test/factories/make-investor"
import { GoalFactory } from "test/factories/make-goal"

describe('Update Investor (E2E)', () => {
    let app: INestApplication
    let investorFactory: InvestorFactory
    let goalFactory: GoalFactory
    let prisma: PrismaService
    let jwt: JwtService

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule, DatabaseModule],
            providers: [InvestorFactory, GoalFactory]
        }).compile()

        app = moduleRef.createNestApplication()
        investorFactory = moduleRef.get(InvestorFactory)
        goalFactory = moduleRef.get(GoalFactory)
        prisma = moduleRef.get(PrismaService)
        jwt = moduleRef.get(JwtService)

        await app.init()
    })

    afterAll(async () => {
        await app.close()
    })

    test('[PATCH] /goal/:goalId', async () => {
        const investor = await investorFactory.makePrismaInvestor()
        const investorId = investor.id.toValue().toString()
        const accessToken = jwt.sign({ sub: investorId })

        const goal = await goalFactory.makePrismaGoal({
            investorId: investor.id
        })
        const goalId = goal.id.toValue().toString()

        const response = await request(app.getHttpServer())
            .patch(`/goal/${goalId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'Meta 1',
                targetAmount: 100000,
                targetDate: '2027-12-31',
                priority: 'High'
            })

        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({
            message: 'Meta de investimento atualizada com sucesso',
        })

        const goalOnDatabase = await prisma.goal.findUnique({
            where: {
                id: goalId
            },
        })

        expect(goalOnDatabase).toBeTruthy()
    })
})