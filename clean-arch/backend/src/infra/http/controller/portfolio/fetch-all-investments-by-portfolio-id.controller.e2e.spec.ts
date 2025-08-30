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

describe('Fecth All Investments By PorfolioId (E2E)', () => {
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

    test('[GET] /portfolio/investments', async () => {
        const investor = await investorFactory.makePrismaInvestor()
        const investorId = investor.id.toValue().toString()
        const accessToken = jwt.sign({ sub: investorId })

        const asset1 = await assetFactory.makePrismaAsset()
        const asset1Id = asset1.id.toValue().toString()
        const asset2 = await assetFactory.makePrismaAsset()
        const asset2Id = asset2.id.toValue().toString()
        
        const portfolio = await portfolioFactory.makePrismaPortfolio({
            investorId: investor.id
        })
        const portfolioId = portfolio.id.toValue().toString()

        const investment1 = await investmentFactory.makePrismaInvestment({
            assetId: asset1.id,
            portfolioId: portfolio.id
        })
        const investment1Id = investment1.id.toValue().toString()

        const investment2 = await investmentFactory.makePrismaInvestment({
            assetId: asset2.id,
            portfolioId: portfolio.id
        })
        const investment2Id = investment2.id.toValue().toString()

        const response = await request(app.getHttpServer())
            .get('/portfolio/investments')
            .set('Authorization', `Bearer ${accessToken}`)
            .send()

        expect(response.statusCode).toBe(200)
        expect(response.body).toHaveLength(2)
        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: investment1Id,
                    assetId: asset1Id,
                    portfolioId,
                    quantity: investment1.quantity.getValue(),
                    currentPrice: investment1.currentPrice.getAmount()
                }),
                expect.objectContaining({
                    id: investment2Id,
                    assetId: asset2Id,
                    portfolioId,
                    quantity: investment2.quantity.getValue(),
                    currentPrice: investment2.currentPrice.getAmount()
                })
            ])
        )
    })
})