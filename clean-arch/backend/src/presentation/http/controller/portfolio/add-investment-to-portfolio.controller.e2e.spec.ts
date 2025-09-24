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

describe('Add Investment to Portfolio (E2E)', () => {
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

    test('[POST] /portfolio/investment', async () => {
        const investor = await investorFactory.makePrismaInvestor()
        const investorId = investor.id.toValue().toString()
        const accessToken = jwt.sign({ sub: investorId })

        const asset = await assetFactory.makePrismaAsset()
        const assetId = asset.id.toValue().toString()
        
        await portfolioFactory.makePrismaPortfolio({
            investorId: investor.id
        })

        const response = await request(app.getHttpServer())
            .post('/portfolio/investment')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                assetId,
                quantity: 10,
                currentPrice: 50
            })

        expect(response.statusCode).toBe(201)
        expect(response.body).toEqual({
            message: 'O investimento foi adicionado ao portfólio com sucesso'
        })

        const investmentOnDatabase = await prisma.investment.findFirst({
            where: {
                assetId
            },
        })

        expect(investmentOnDatabase).toBeTruthy()
    })
})