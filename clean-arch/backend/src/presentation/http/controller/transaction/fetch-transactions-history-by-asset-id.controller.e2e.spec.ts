import { INestApplication } from "@nestjs/common"
import { Test } from '@nestjs/testing'
import { JwtService } from "@nestjs/jwt"
import request from 'supertest'

import { AppModule } from "@/infra/app.module"
import { DatabaseModule } from "@/infra/database/database.module"

import { InvestorFactory } from "test/factories/make-investor"
import { PortfolioFactory } from "test/factories/make-portfolio"
import { AssetFactory } from "test/factories/make-asset"
import { InvestmentFactory } from "test/factories/make-investment"
import { TransactionFactory } from "test/factories/make-transaction"

describe('Fecth Transactions History By AssetId (E2E)', () => {
    let app: INestApplication
    let investorFactory: InvestorFactory
    let assetFactory: AssetFactory
    let portfolioFactory: PortfolioFactory
    let investmentFactory: InvestmentFactory
    let transactionFactory: TransactionFactory
    let jwt: JwtService

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule, DatabaseModule],
            providers: [InvestorFactory, AssetFactory, PortfolioFactory, InvestmentFactory, TransactionFactory]
        }).compile()

        app = moduleRef.createNestApplication()
        investorFactory = moduleRef.get(InvestorFactory)
        assetFactory = moduleRef.get(AssetFactory)
        portfolioFactory = moduleRef.get(PortfolioFactory)
        investmentFactory = moduleRef.get(InvestmentFactory)
        transactionFactory = moduleRef.get(TransactionFactory)
        jwt = moduleRef.get(JwtService)

        await app.init()
    })

    afterAll(async () => {
        await app.close()
    })

    test('[GET] /asset/:assetId/transactions', async () => {
        const investor = await investorFactory.makePrismaInvestor()
        const investorId = investor.id.toValue().toString()
        const accessToken = jwt.sign({ sub: investorId })

        const asset = await assetFactory.makePrismaAsset()
        const assetId = asset.id.toValue().toString()
        
        const portfolio = await portfolioFactory.makePrismaPortfolio({
            investorId: investor.id
        })
        const portfolioId = portfolio.id.toValue().toString()

        await investmentFactory.makePrismaInvestment({
            assetId: asset.id,
            portfolioId: portfolio.id
        })

        const transactionA = await transactionFactory.makePrismaTransaction({
                assetId: asset.id,
                portfolioId: portfolio.id
        })
        
        const transactionB = await transactionFactory.makePrismaTransaction({
                assetId: asset.id,
                portfolioId: portfolio.id
        })

        const response = await request(app.getHttpServer())
            .get(`/asset/${assetId}/transactions`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send()

        expect(response.statusCode).toBe(200)
        expect(response.body.transactions).toHaveLength(2)
        expect(response.body.transactions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: transactionA.id.toValue().toString(),
                    assetId,
                    portfolioId,
                    quantity: transactionA.quantity.getValue(),
                    price: transactionA.price.getAmount(),
                    transactionType: transactionA.transactionType,
                    dateAt: transactionA.dateAt.toISOString()
                }),
                expect.objectContaining({
                    id: transactionB.id.toValue().toString(),
                    assetId,
                    portfolioId,
                    quantity: transactionB.quantity.getValue(),
                    price: transactionB.price.getAmount(),
                    transactionType: transactionB.transactionType,
                    dateAt: transactionB.dateAt.toISOString()
                })
            ])
        )
    })
})