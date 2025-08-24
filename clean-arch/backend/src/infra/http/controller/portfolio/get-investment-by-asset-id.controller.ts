import {
  Controller,
  Get,
  Param,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";

import { GetInvestmentByAssetIdService } from "@/domain/portfolio/services/get-investment-by-asset-id";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Public } from "@/infra/auth/public";
import { InvestmentPresenter } from "@/infra/presenters/investment-presenter";
import { GetInvestmentByAssetIdResponseDto } from "./dto/get-investment-by-asset-id-response-dto";
import { GetInvestmentByAssetIdBusinessErrorDto } from "./dto/get-investment-by-asset-id-error-response-dto";

@ApiTags('Portfolios')
@Controller("/:investorId/portfolio/investment/:assetId")
@Public()
export class GetInvestmentByAssetIdController {
  constructor(private getInvestmentByAssetIdService: GetInvestmentByAssetIdService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar investimento por ID do ativo',
    description: `
      Recupera os detalhes de um investimento específico no portfólio do investidor baseado no ID do ativo:
      - Retorna informações detalhadas do investimento se encontrado
      - Inclui quantidade atual, preço médio, valor total e performance
      - Retorna null se o investidor não possui investimento no ativo especificado
      - Útil para verificar posição atual em um ativo específico
      - Mostra histórico de performance e rentabilidade
    `
  })
  @ApiParam({
    name: 'investorId',
    description: 'ID único do investidor proprietário do portfólio',
    example: 'uuid-123-456-789'
  })
  @ApiParam({
    name: 'assetId',
    description: 'ID único do ativo a ser consultado',
    example: 'uuid-asset-999-888'
  })
  @ApiOkResponse({
    description: 'Investimento encontrado com sucesso',
    type: GetInvestmentByAssetIdResponseDto,
    examples: {
      found: {
        summary: 'Investimento encontrado',
        value: {
          id: 'uuid-investment-123-456',
          assetId: 'uuid-asset-999-888',
          portfolioId: 'uuid-portfolio-789',
          investorId: 'uuid-123-456-789',
          quantity: 150,
          currentPrice: 32.50
        }
      },
      notFound: {
        summary: 'Investimento não encontrado',
        value: null
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Investidor não encontrado ou sem acesso ao portfólio',
    type: GetInvestmentByAssetIdBusinessErrorDto,
    examples: {
      investorNotFound: {
        summary: 'Investidor não encontrado',
        value: {
          statusCode: 404,
          message: 'Investidor não encontrado',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/uuid-123-456-789/portfolio/investment/PETR4'
        }
      },
      portfolioNotFound: {
        summary: 'Portfólio não encontrado',
        value: {
          statusCode: 404,
          message: 'Portfólio não encontrado para este investidor',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/uuid-123-456-789/portfolio/investment/PETR4'
        }
      }
    }
  })
  async handle(
    @Param("investorId") investorId: string,
    @Param("assetId") assetId: string,
  ): Promise<{
    id: string;
    assetId: string;
    portfolioId: string;
    quantity: number;
    currentPrice: number;
  } | null> {
    const result = await this.getInvestmentByAssetIdService.execute({
      investorId,
      assetId,
    });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw new NotFoundException("Erro inesperado ao buscar investimento");
    }

    const { investment } = result.value;

    if (!investment) {
      return null;
    }

    return InvestmentPresenter.toHTTP(investment);
  }
}
