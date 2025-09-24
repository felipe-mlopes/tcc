import { INestApplication } from "@nestjs/common"
import { Test } from '@nestjs/testing'
import request from 'supertest'

import { PrismaService } from "@/infra/database/prisma/prisma.service"
import { AppModule } from "@/infra/app.module"

describe('Register Investor (E2E)', () => {
    let app: INestApplication
    let prisma: PrismaService

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule]
        }).compile()

        app = moduleRef.createNestApplication()
        prisma = moduleRef.get(PrismaService)

        await app.init()
    })

    afterAll(async () => {
        await app.close()
    })

    test('[POST] /investor', async () => {
        const investorData = {
            email: `john-doe-${Date.now()}@example.com`, // Email único para evitar conflitos
            name: "John Doe",
            cpf: "03698732156",
            password: "#passwordTest123",
            dateOfBirth: "1990-05-15"
        }

        const response = await request(app.getHttpServer())
            .post('/investor')
            .send(investorData)

        expect(response.statusCode).toBe(201)
        expect(response.body).toEqual({
            message: 'O cadastro de investidor foi realizado com sucesso'
        })

        const investorOnDatabase = await prisma.investor.findUnique({
            where: {
                email: investorData.email
            }
        })

        expect(investorOnDatabase).toBeTruthy()
        expect(investorOnDatabase?.email).toBe(investorData.email)
        expect(investorOnDatabase?.name).toBe(investorData.name)
        expect(investorOnDatabase?.cpf).toBe(investorData.cpf)
    })
})