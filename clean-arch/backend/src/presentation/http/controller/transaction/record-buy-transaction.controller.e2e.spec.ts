import { INestApplication } from "@nestjs/common"
import { Test } from '@nestjs/testing'
import { JwtService } from "@nestjs/jwt"
import request from 'supertest'

import { AppModule } from "@/infra/app.module"
import { DatabaseModule } from "@/infra/database/database.module"
import { PrismaService } from "@/infra/database/prisma/prisma.service"

import { InvestorFactory } from "test/factories/make-investor"
import { AssetFactory } from "test/factories/make-asset"
import { PortfolioFactory } from "test/factories/make-portfolio"

describe('Record Buy Transaction (E2E)', () => {
    let app: INestApplication
    let investorFactory: InvestorFactory
    let assetFactory: AssetFactory
    let portfolioFactory: PortfolioFactory
    let prisma: PrismaService
    let jwt: JwtService

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule, DatabaseModule],
            providers: [InvestorFactory, AssetFactory, PortfolioFactory]
        }).compile()

        app = moduleRef.createNestApplication()
        investorFactory = moduleRef.get(InvestorFactory)
        assetFactory = moduleRef.get(AssetFactory)
        portfolioFactory = moduleRef.get(PortfolioFactory)
        prisma = moduleRef.get(PrismaService)
        jwt = moduleRef.get(JwtService)

        await app.init()
    })

    afterAll(async () => {
        await app.close()
    })

    test('[POST] /transactions/buy', async () => {
        const investor = await investorFactory.makePrismaInvestor()
        const investorId = investor.id.toValue().toString()
        const accessToken = jwt.sign({ sub: investorId })

        const asset = await assetFactory.makePrismaAsset()
        const assetId = asset.id.toValue().toString()

        const portfolio = await portfolioFactory.makePrismaPortfolio({
            investorId: investor.id
        })
        const portfolioId = portfolio.id.toValue().toString()

        const response = await request(app.getHttpServer())
            .post('/transactions/buy')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                assetId,
                quantity: 20,
                price: 50,
                fees: 1,
                dateAt: "2025-07-31T14:30:00Z"
            })

        expect(response.statusCode).toBe(201)
        expect(response.body).toEqual({
            message: 'A transação de compra foi registrada com sucesso',
        })

        expect(response.headers.location).toBeDefined()
        expect(response.headers.location).toMatch(/^\/transactions\/buy\/[a-zA-Z0-9-]+$/)

        const transactionOnDatabase = await prisma.transaction.findFirst({
            where: {
                portfolioId
            },
        })

        expect(transactionOnDatabase).toBeTruthy()
    })
})