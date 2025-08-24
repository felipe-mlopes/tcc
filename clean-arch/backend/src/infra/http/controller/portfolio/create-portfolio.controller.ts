import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";

import { Public } from "@/infra/auth/public";
import { CreatePortfolioService } from "@/domain/portfolio/services/create-portfolio";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CreatePortfolioDto } from "./dto/create-portfolio-dto";
import { CreatePortfolioResponseDto } from "./dto/create-portfolio-response-dto";
import { CreatePortfolioBusinessErrorDto, CreatePortfolioValidationErrorDto } from "./dto/create-portfolio-error-response-dto";

@ApiTags('Portfolios')
@Controller("/:investorId/portfolio")
@Public()
export class CreatePortfolioController {
  constructor(private createPortfolioService: CreatePortfolioService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo portfólio',
    description: `
    Cria um novo portfólio para um investidor específico:
    - Nome: Mínimo 3 caracteres, identificador único do portfólio
    - Descrição: Campo opcional para detalhar o propósito do portfólio
    - O portfólio será associado ao investidor especificado na URL
    `
  })
  @ApiParam({
    name: 'investorId',
    description: 'ID único do investidor proprietário do portfólio',
    example: 'uuid-123-456-789'
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
          path: '/uuid-123-456-789/portfolio'
        }
      },
      emptyName: {
        summary: 'Nome vazio',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['name: Nome é obrigatório'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/uuid-123-456-789/portfolio'
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
      path: '/uuid-123-456-789/portfolio'
    }
  })
  async handle(
    @Param("investorId") investorId: string,
    @Body() body: CreatePortfolioDto
  ): Promise<string> {
    const { name, description } = body;

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
    
    return result.value.message
  }
}
