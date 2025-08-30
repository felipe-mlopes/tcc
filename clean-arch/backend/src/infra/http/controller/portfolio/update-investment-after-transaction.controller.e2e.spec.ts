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
import { TransactionFactory } from "test/factories/make-transaction"
import { _ } from "vitest/dist/chunks/reporters.d.BFLkQcL6"
import { TransactionType } from "@/domain/transaction/entities/transaction"

describe('Update Investment After Transaction (E2E)', () => {
    let app: INestApplication
    let investorFactory: InvestorFactory
    let assetFactory: AssetFactory
    let portfolioFactory: PortfolioFactory
    let transactionFactory: TransactionFactory
    let prisma: PrismaService
    let jwt: JwtService

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule, DatabaseModule],
            providers: [InvestorFactory, AssetFactory, PortfolioFactory, TransactionFactory]
        }).compile()

        app = moduleRef.createNestApplication()
        investorFactory = moduleRef.get(InvestorFactory)
        assetFactory = moduleRef.get(AssetFactory)
        portfolioFactory = moduleRef.get(PortfolioFactory)
        transactionFactory = moduleRef.get(TransactionFactory)
        prisma = moduleRef.get(PrismaService)
        jwt = moduleRef.get(JwtService)

        await app.init()
    })

    afterAll(async () => {
        await app.close()
    })

    test('[PATCH] /portfolio/investment/:transactionId/update', async () => {
        const investor = await investorFactory.makePrismaInvestor()
        const investorId = investor.id.toValue().toString()
        const accessToken = jwt.sign({ sub: investorId })

        const asset = await assetFactory.makePrismaAsset()
        
        const portfolio = await portfolioFactory.makePrismaPortfolio({
            investorId: investor.id
        })
        const portfolioId = portfolio.id.toValue().toString()

        const transaction = await transactionFactory.makePrismaTransaction({
            assetId: asset.id,
            portfolioId: portfolio.id
        }, TransactionType.Buy)
        const transactionId = transaction.id.toValue().toString()

        const response = await request(app.getHttpServer())
            .patch(`/portfolio/investment/${transactionId}/update`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send()

        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({
            message: 'Após a inclusão da transação, o investimento foi atualizado com sucesso'
        })

        const investmentOnDatabase = await prisma.investment.findFirst({
            where: {
                portfolioId
            }
        })

        expect(investmentOnDatabase).toBeTruthy()
    })
})