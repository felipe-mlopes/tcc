import { BadRequestException, Body, Controller, NotFoundException, Post } from "@nestjs/common";
import { z } from "zod";

import { Public } from "@/infra/auth/public";
import { RegisterInvestorService } from "@/domain/investor/services/register-investor";
import { NotAllowedError } from "@/core/errors/not-allowed-error";

const registerInvestorBodySchema = z.object({
    email: z.email(),
    name: z.string().min(3),
    cpf: z.string().min(11).max(11),
    dateOfBirth: z.coerce.date()
});

type RegisterInvestorBody = z.infer<typeof registerInvestorBodySchema>;

@Controller('/investor')
@Public()
export class RegisterInvestorController {
    constructor(private registerInvestorService: RegisterInvestorService) {}

    @Post()
    async handle(@Body() body: RegisterInvestorBody): Promise<void> {
        const { email, name, cpf, dateOfBirth } = body;

        const result = await this.registerInvestorService.execute({
            email,
            name,
            cpf,
            dateOfBirth
        });

        if (result.isLeft()) {
            const error = result.value;

            switch (error.constructor) {
                case NotAllowedError:
                    throw new BadRequestException(error.message);
                default:
                    throw new BadRequestException('Unexpected error');
            }
        }   
    }
}