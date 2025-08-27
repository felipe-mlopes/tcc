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
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { AddInvestmentToPortfolioService } from "@/domain/portfolio/services/add-investment-to-portfolio";
import { Public } from "@/infra/auth/public";
import { AddInvestmentToPortfolioDto } from "./dto/add-investment-to-portfolio-dto";
import { AddInvestmentToPortfolioResponseDto } from "./dto/add-investment-to-portfolio-response-dto";
import { AddInvestmentToPortfolioBusinessErrorDto, AddInvestmentToPortfolioValidationErrorDto } from "./dto/add-investment-to-portfolio-error-response-dto";
import { CurrentUser } from "@/infra/auth/current-user.decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";

@ApiTags('Portfolios')
@ApiBearerAuth()
@Controller("/portfolio/investment")
export class AddInvestmentToPortfolioController {
  constructor(private addInvestmentToPortfolioService: AddInvestmentToPortfolioService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Adicionar investimento ao portfólio',
    description: `
    Adiciona um novo investimento ao portfólio do investidor:
      - Asset ID: Identificador único do ativo a ser investido
      - Quantidade: Número de cotas/ações a serem adquiridas (deve ser positiva)
      - Preço atual: Valor unitário do ativo no momento da compra (deve ser positivo)
      - O investimento será adicionado ao portfólio principal do investidor
      - O valor total será calculado automaticamente (quantidade × preço)
      - **Requer autenticação**: Token JWT no header Authorization
    `
  })
  @ApiBody({
    type: AddInvestmentToPortfolioDto,
    description: 'Dados necessários para adicionar um investimento ao portfólio',
    examples: {
      stock: {
        summary: 'Investimento em ação',
        description: 'Exemplo de compra de ações',
        value: {
          assetId: 'PETR4',
          quantity: 100,
          currentPrice: 28.50
        }
      },
      fund: {
        summary: 'Investimento em fundo',
        description: 'Exemplo de aplicação em fundo de investimento',
        value: {
          assetId: 'FUND-ABC-123',
          quantity: 50,
          currentPrice: 125.75
        }
      },
      crypto: {
        summary: 'Investimento em criptomoeda',
        description: 'Exemplo de compra de criptomoeda',
        value: {
          assetId: 'BTC',
          quantity: 0.1,
          currentPrice: 150000.00
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Investimento adicionado ao portfólio com sucesso',
    type: AddInvestmentToPortfolioResponseDto,
    example: {
      message: 'O investimento foi adicionado ao portfólio com sucesso'
    }
  })
  @ApiUnauthorizedResponse({
      description: 'Token JWT não fornecido ou inválido',
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        timestamp: '2024-01-15T10:30:00Z',
        path: '/portfolio/investment'
      }
    })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos ou erro de validação',
    type: AddInvestmentToPortfolioValidationErrorDto,
    examples: {
      quantityValidation: {
        summary: 'Quantidade inválida',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['quantity: Quantidade deve ser um número positivo'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/portfolio/investment'
        }
      },
      priceValidation: {
        summary: 'Preço inválido',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['currentPrice: Preço atual deve ser um número positivo'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/portfolio/investment'
        }
      },
      multipleErrors: {
        summary: 'Múltiplos erros',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: [
            'assetId: ID do ativo é obrigatório',
            'quantity: Quantidade deve ser um número positivo',
            'currentPrice: Preço atual deve ser um número positivo'
          ],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/portfolio/investment'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Investidor, portfólio ou ativo não encontrados',
    type: AddInvestmentToPortfolioBusinessErrorDto,
    examples: {
      investorNotFound: {
        summary: 'Investidor não encontrado',
        value: {
          statusCode: 404,
          message: 'Investidor não encontrado',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/portfolio/investment'
        }
      },
      portfolioNotFound: {
        summary: 'Portfólio não encontrado',
        value: {
          statusCode: 404,
          message: 'Portfólio não encontrado para este investidor',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/portfolio/investment'
        }
      },
      assetNotFound: {
        summary: 'Ativo não encontrado',
        value: {
          statusCode: 404,
          message: 'Ativo não encontrado ou indisponível para investimento',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/portfolio/investment'
        }
      }
    }
  })
  async handle(
    @Body() body: AddInvestmentToPortfolioDto,
    @CurrentUser() user: UserPayload
  ): Promise<AddInvestmentToPortfolioResponseDto> {
    const { assetId, quantity, currentPrice } = body;
    const investorId = user.sub
    
    const result = await this.addInvestmentToPortfolioService.execute({
      investorId,
      assetId,
      quantity,
      currentPrice,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException("Erro inesperado ao adicionar investimento ao portfólio");
      }
    }

    return {
      message: result.value.message
    }
  }
}
