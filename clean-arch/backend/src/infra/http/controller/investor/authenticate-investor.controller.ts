import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";

import { WrongCredentialsError } from "@/core/errors/wrong-credentials-error";
import { AuthenticateInvestorService } from "@/domain/investor/services/authenticate-investor";
import { Public } from "@/infra/auth/public";
import { AuthenticateInvestorDto } from "./dto/authenticate-investor-dto";
import { AuthenticateInvestorResponseDto } from "./dto/authenticate-investor-response-dto";
import { AuthenticateInvestorErrorDto } from "./dto/authenticate-investor-error-response-dto";

@ApiTags('Investors')
@Controller('/investor/auth')
@Public()
export class AuthenticateInvestorController {
    constructor(private authenticatetInvestorService: AuthenticateInvestorService) {}
    
    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Autenticar investidor',
        description: `
            Autentica um investidor no sistema usando email e senha:
            - Valida as credenciais fornecidas
            - Retorna um token JWT para acesso às rotas protegidas
            - O token deve ser usado no header Authorization: Bearer {token}
        `
    })
    @ApiBody({
        type: AuthenticateInvestorDto,
        description: 'Credenciais do investidor para autenticação',
        examples: {
            validCredentials: {
                summary: 'Credenciais válidas',
                value: {
                    email: 'joao.silva@email.com',
                    password: '#passwordTest123'
                }
            }
        }
    })
    @ApiCreatedResponse({
        description: 'Investidor autenticado com sucesso',
        type: AuthenticateInvestorResponseDto,
        examples: {
            success: {
                summary: 'Autenticação bem-sucedida',
                value: {
                    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dWlkLTEyMy00NTYtNzg5IiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.signature'
                }
            }
        }
    })
    @ApiUnauthorizedResponse({
        description: 'Credenciais inválidas',
        type: AuthenticateInvestorErrorDto,
        examples: {
            wrongCredentials: {
                summary: 'Email ou senha incorretos',
                value: {
                    statusCode: 401,
                    message: 'Credenciais inválidas',
                    timestamp: '2024-01-15T10:30:00Z',
                    path: '/investor/auth'
                }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'Erro de validação ou erro inesperado',
        type: AuthenticateInvestorErrorDto,
        examples: {
            validationError: {
                summary: 'Erro de validação',
                value: {
                    statusCode: 400,
                    message: ['email deve ser um email válido', 'password não deve estar vazio'],
                    timestamp: '2024-01-15T10:30:00Z',
                    path: '/investor/auth'
                }
            },
            unexpectedError: {
                summary: 'Erro inesperado',
                value: {
                    statusCode: 400,
                    message: 'Erro inesperado ao autenticar investidor',
                    timestamp: '2024-01-15T10:30:00Z',
                    path: '/investor/auth'
                }
            }
        }
    })
    async handle(@Body() body: AuthenticateInvestorDto): Promise<AuthenticateInvestorResponseDto> {
        const { email, password } = body

        const result = await this.authenticatetInvestorService.execute({
            email,
            password
        })

        if (result.isLeft()) {
            const error = result.value;

            switch (error.constructor) {
                case WrongCredentialsError:
                    throw new UnauthorizedException(error.message);
                default:
                    throw new BadRequestException('Erro inesperado ao autenticar investidor');
            }
        }

        const { accessToken } = result.value

        return {
            access_token: accessToken,
        }
    }
}