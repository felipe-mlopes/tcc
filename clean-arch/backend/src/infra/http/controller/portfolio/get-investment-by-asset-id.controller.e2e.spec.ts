import { INestApplication } from "@nestjs/common"
import { Test } from '@nestjs/testing'
import { JwtService } from "@nestjs/jwt"
import request from 'supertest'

import { AppModule } from "@/infra/app.module"
import { DatabaseModule } from "@/infra/database/database.module"
import { PrismaService } from "@/infra/database/prisma/prisma.service"

import { InvestorFactory } from "test/factories/make-investor"
import { PortfolioFactory } from "test/factories/make-portfolio"
import { AssetFactory } from "test/factories/make-asset"
import { InvestmentFactory } from "test/factories/make-investment"

describe('Get Investment By AssetId (E2E)', () => {
    let app: INestApplication
    let investorFactory: InvestorFactory
    let assetFactory: AssetFactory
    let portfolioFactory: PortfolioFactory
    let investmentFactory: InvestmentFactory
    let prisma: PrismaService
    let jwt: JwtService

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule, DatabaseModule],
            providers: [InvestorFactory, AssetFactory, PortfolioFactory, InvestmentFactory]
        }).compile()

        app = moduleRef.createNestApplication()
        investorFactory = moduleRef.get(InvestorFactory)
        assetFactory = moduleRef.get(AssetFactory)
        portfolioFactory = moduleRef.get(PortfolioFactory)
        investmentFactory = moduleRef.get(InvestmentFactory)
        prisma = moduleRef.get(PrismaService)
        jwt = moduleRef.get(JwtService)

        await app.init()
    })

    afterAll(async () => {
        await app.close()
    })

    test('[GET] /portfolio/investment/:assetId', async () => {
        const investor = await investorFactory.makePrismaInvestor()
        const investorId = investor.id.toValue().toString()
        const accessToken = jwt.sign({ sub: investorId })

        const asset = await assetFactory.makePrismaAsset()
        const assetId = asset.id.toValue().toString()
        
        const portfolio = await portfolioFactory.makePrismaPortfolio({
            investorId: investor.id
        })
        const portfolioId = portfolio.id.toValue().toString()

        const investment = await investmentFactory.makePrismaInvestment({
            assetId: asset.id,
            portfolioId: portfolio.id
        })
        const investmentId = investment.id.toValue().toString()

        const response = await request(app.getHttpServer())
            .get(`/portfolio/investment/${assetId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send()

        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({
            id: investmentId,
            assetId,
            portfolioId,
            quantity: investment.quantity.getValue(),
            currentPrice: investment.currentPrice.getAmount()
        })
    })
})