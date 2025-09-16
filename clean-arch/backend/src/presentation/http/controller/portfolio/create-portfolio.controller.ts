import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from "@nestjs/common";
import { 
  ApiBadRequestResponse, 
  ApiBearerAuth, 
  ApiBody, 
  ApiCreatedResponse, 
  ApiNotFoundResponse, 
  ApiOperation, 
  ApiTags, 
  ApiUnauthorizedResponse
} from "@nestjs/swagger";

import { CreatePortfolioService } from "@/domain/portfolio/services/create-portfolio";
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error";
import { CurrentUser } from "@/infra/auth/current-user.decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";
import { CreatePortfolioDto } from "./dto/create-portfolio-dto";
import { CreatePortfolioResponseDto } from "./dto/create-portfolio-response-dto";
import { CreatePortfolioBusinessErrorDto, CreatePortfolioValidationErrorDto } from "./dto/create-portfolio-error-response-dto";

@ApiTags('Portfolios')
@ApiBearerAuth()
@Controller("/portfolio")
export class CreatePortfolioController {
  constructor(readonly createPortfolioService: CreatePortfolioService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo portfólio',
    description: `
    Cria um novo portfólio para um investidor específico:
    - Nome: Mínimo 3 caracteres, identificador único do portfólio
    - Descrição: Campo opcional para detalhar o propósito do portfólio
    - O portfólio será associado ao investidor especificado na URL
    - **Requer autenticação**: Token JWT no header Authorization
    `
  })
  @ApiBody({
    type: CreatePortfolioDto,
    description: 'Dados necessários para criar um novo portfólio',
    examples: {
      valid: {
        summary: 'Dados válidos',
        description: 'Exemplo com todos os campos preenchidos corretamente',
        value: {
          name: 'Portfólio Conservador',
          description: 'Carteira focada em investimentos de baixo risco para reserva de emergência'
        }
      },
      minimal: {
        summary: 'Dados mínimos',
        description: 'Exemplo com apenas os campos obrigatórios',
        value: {
          name: 'Minha Carteira Principal'
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Portfólio criado com sucesso',
    type: CreatePortfolioResponseDto,
    example: {
      message: 'O portfólio foi criado com sucesso'
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT não fornecido ou inválido',
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      timestamp: '2024-01-15T10:30:00Z',
      path: '/portfolio'
    }
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos ou erro de validação',
    type: CreatePortfolioValidationErrorDto,
    examples: {
      nameValidation: {
        summary: 'Nome muito curto',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['name: Nome deve ter pelo menos 3 caracteres'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/portfolio'
        }
      },
      emptyName: {
        summary: 'Nome vazio',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['name: Nome é obrigatório'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/portfolio'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Investidor não encontrado',
    type: CreatePortfolioBusinessErrorDto,
    example: {
      statusCode: 404,
      message: 'Investidor não encontrado',
      timestamp: '2024-01-15T10:30:00Z',
      path: '/portfolio'
    }
  })
  async handle(
    @Body() body: CreatePortfolioDto,
    @CurrentUser() user: UserPayload
  ): Promise<CreatePortfolioResponseDto> {
    const { name, description } = body;
    const investorId = user.sub

    const result = await this.createPortfolioService.execute({
      investorId,
      name,
      description,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException("Erro inesperado ao criar portfólio");
      }
    }
    
    return {
      message: result.value.message
    }
  }
}
