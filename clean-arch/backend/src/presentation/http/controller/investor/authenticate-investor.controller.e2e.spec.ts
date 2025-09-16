import { INestApplication } from "@nestjs/common"
import { Test } from '@nestjs/testing'
import request from 'supertest'

import { AppModule } from "@/infra/app.module"
import { DatabaseModule } from "@/infra/database/database.module"
import { InvestorFactory } from "test/factories/make-investor"
import { Email } from "@/core/value-objects/email"
import { Password } from "@/core/value-objects/password"
import { hash } from "bcryptjs"

describe('Auth Investor (E2E)', () => {
    let app: INestApplication
    let investorFactory: InvestorFactory

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule, DatabaseModule],
            providers: [InvestorFactory]
        }).compile()

        app = moduleRef.createNestApplication()
        investorFactory = moduleRef.get(InvestorFactory)

        await app.init()
    })

    afterAll(async () => {
        await app.close()
    })

    test('[POST] /investor/auth', async () => {
        const passwordHashed = await hash("#passwordTest123", 8)

        await investorFactory.makePrismaInvestor({
            email: Email.create("john-doe@example.com"),
            password:  Password.create(passwordHashed)
        })

        const response = await request(app.getHttpServer())
            .post('/investor/auth')
            .send({
                email: "john-doe@example.com",
                password: "#passwordTest123"
            })

        expect(response.statusCode).toBe(201)
        expect(response.body).toEqual({
            access_token: expect.any(String),
        })
    })
})