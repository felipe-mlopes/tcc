import { Email } from "@/core/value-objects/email";
import { Name } from "@/core/value-objects/name";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const updateInvestorBodySchema = z.object({
    name: z
        .string()
        .optional()
        .refine((name) => {
            if (!name) return true;
            try {
                Name.create(name);
                return true;
            } catch (error) {
                return false;
            }
        }, 'Nome deve ter pelo menos 2 caracteres e conter apenas letras, espaços, hífens, pontos e números')
        .transform((name) => {
            if (!name) return undefined;
            return Name.create(name).getValue()
        }),

    email: z
        .string()
        .optional()
        .refine((email) => {
            if (!email) return true;
            try {
                Email.create(email);
                return true;
            } catch (error) {
                return false;
            }
        }, 'Email deve ter um formato válido')
        .transform((email) => {
            if (!email) return undefined;
            return Email.create(email).getValue()
        })
}).refine((data) => {
    return data.email !== undefined || data.name !== undefined
}, {
    message: 'Pelo menos um campo deve ser fornecido para atualização (name ou email)',
    path: ['body']
});

export class UpdateInvestorDto extends createZodDto(updateInvestorBodySchema) {
    @ApiPropertyOptional({
        description: 'Nome completo do investidor (será validado usando a classe Name)',
        example: 'João Silva Santos',
        minLength: 2,
        pattern: '^[A-Za-zÀ-ÖØ-öø-ÿ\\s\\-\'\\.0-9º°ª]+$'
    })
    name?: string;
    
    @ApiPropertyOptional({
        description: 'Email único do investidor (será validado usando a classe Email)',
        example: 'joao.silva@email.com',
        format: 'email'
    })
    email?: string;
}