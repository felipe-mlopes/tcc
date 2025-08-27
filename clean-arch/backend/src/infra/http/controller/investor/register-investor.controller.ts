import { BadRequestException, Body, ConflictException, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { RegisterInvestorService } from "@/domain/investor/services/register-investor";
import { Public } from "@/infra/auth/public";
import { RegisterInvestorDto } from "./dto/register-investor-dto";
import { RegisterInvestorResponseDto } from "./dto/register-investor-response-dto";
import { RegisterInvestorBusinessErrorDto, RegisterInvestorValidationErrorDto } from "./dto/register-investor-error-response-dto";

@ApiTags('Investors')
@Controller('/investor')
@Public()
export class RegisterInvestorController {
    constructor(private registerInvestorService: RegisterInvestorService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ 
        summary: 'Registrar novo investidor',
        description: `
        Cria um novo investidor no sistema usando Value Objects para validações:
            - Email: Validado pela classe Email (formato padrão)
            - Nome: Validado pela classe Name (mín. 2 chars, letras, espaços, hífens, pontos, números)
            - CPF: Validado pela classe CPF (formato e dígitos verificadores)
            - Data de Nascimento: Validada pela classe DateOfBirth (idade mínima 18 anos, não futuro)
        `
    })
    @ApiBody({
        type: RegisterInvestorDto,
        description: 'Dados necessários para registrar um novo investidor',
        examples: {
            valid: {
                summary: 'Dados válidos',
                description: 'Exemplo com todos os campos preenchidos corretamente',
                value: {
                    email: 'joao.silva@email.com',
                    name: 'João Silva Santos',
                    cpf: '12345678901',
                    password: '#passwordTest123',
                    dateOfBirth: '1990-05-15'
                }
            }
        }
    })
    @ApiCreatedResponse({
        description: 'Investidor registrado com sucesso',
        type: RegisterInvestorResponseDto,
        example: {
            message: 'O cadastro de investidor foi realizado com sucesso'
        }
    })
    @ApiBadRequestResponse({
        description: 'Dados de entrada inválidos ou erro de validação',
        type: RegisterInvestorValidationErrorDto,
        examples: {
            emailValidation: {
                summary: 'Email inválido',
                value: {
                    statusCode: 400,
                    message: 'Validation failed',
                    details: ['email: Email deve ter um formato válido'],
                    timestamp: '2024-01-15T10:30:00Z',
                    path: '/investor'
                }
            }
        }
    })
    @ApiConflictResponse({
        description: 'Conflito - Investidor já existe',
        type: RegisterInvestorBusinessErrorDto,
        example: {
            statusCode: 409,
            message: 'Investidor com este email ou CPF já existe',
            timestamp: '2024-01-15T10:30:00Z',
            path: '/investor'
        }
    })
    async handle(@Body() body: RegisterInvestorDto): Promise<RegisterInvestorResponseDto> {
        const { email, name, cpf, password, dateOfBirth } = body;

        const birthDate = new Date(dateOfBirth)

        const result = await this.registerInvestorService.execute({
            email,
            name,
            cpf,
            password,
            dateOfBirth: birthDate
        });

        if (result.isLeft()) {
            const error = result.value;

            switch (error.constructor) {
                case NotAllowedError:
                    if (error.message.includes('já existe') || 
                        error.message.includes('already exists') ||
                        error.message.includes('já cadastrado') ||
                        error.message.includes('already registered')) {
                        throw new ConflictException(error.message);
                    }
                    throw new BadRequestException(error.message);
                default:
                    throw new BadRequestException('Erro inesperado ao registrar investidor');
            }
        }
        
        return {
            message: result.value.message
        }
    }
}