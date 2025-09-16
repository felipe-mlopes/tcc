import { INestApplication } from "@nestjs/common"
import { Test } from '@nestjs/testing'
import { JwtService } from "@nestjs/jwt"
import request from 'supertest'

import { AppModule } from "@/infra/app.module"
import { DatabaseModule } from "@/infra/database/database.module"
import { InvestorFactory } from "test/factories/make-investor"
import { PrismaService } from "@/infra/database/prisma/prisma.service"

describe('Create Portfolio (E2E)', () => {
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

    test('[POST] /portfolio', async () => {
        const investor = await investorFactory.makePrismaInvestor()
        const investorId = investor.id.toValue().toString()
        const accessToken = jwt.sign({ sub: investorId })

        const response = await request(app.getHttpServer())
            .post('/portfolio')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'Portfólio Conservador',
                email: 'Carteira focada em investimentos de baixo risco para reserva de emergência',
            })

        expect(response.statusCode).toBe(201)
        expect(response.body).toEqual({
            message: 'O portfólio foi criado com sucesso',
        })

        const portfolioOnDatabase = await prisma.portfolio.findFirst({
            where: {
                investorId
            },
        })

        expect(portfolioOnDatabase).toBeTruthy()
    })
})