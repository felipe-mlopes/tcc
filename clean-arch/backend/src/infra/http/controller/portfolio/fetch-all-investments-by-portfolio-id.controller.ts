import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";

import { FetchAllInvestmentsByPortfolioIdService } from "@/domain/portfolio/services/fetch-all-investments-by-portfolio-id";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Public } from "@/infra/auth/public";
import { InvestmentPresenter } from "@/infra/presenters/investment-presenter";
import { FetchAllInvestmentsByPortfolioIdResponseDto } from "./dto/fetch-all-investments-by-portfolio-id-response-dto";
import { FetchAllInvestmentByPortfolioIdBusinessErrorDto } from "./dto/fetch-all-investments-by-portfolio-id-error-response-dto";

@ApiTags('Portfolios')
@Controller("/:investorId/portfolio/investments")
@Public()
export class FetchAllInvestmentsByPortfolioIdController {
  constructor(
    private fetchAllInvestmentsByPortfolioIdService: FetchAllInvestmentsByPortfolioIdService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar investimentos por ID do portfólio',
    description: `
      Busca os investimentos realizados no portfólio do investidor baseado no ID do portfólio:
      - Retorna informações dos investimentos se encontrado
      - Inclui quantidade atual e último preço transacionado
      - Retorna null se o investidor não possui nenhum investimento
    `
  })
  @ApiParam({
    name: 'investorId',
    description: 'ID único do investidor proprietário do portfólio',
    example: 'uuid-123-456-789'
  })
  @ApiQuery({
    name: 'page',
    description: 'Número da página para paginação dos resultados',
    required: false,
    type: 'number',
    example: 1,
    schema: {
      type: 'integer',
      minimum: 1,
      default: 1
    }
  })
  @ApiOkResponse({
    description: 'Investimentos encontrado com sucesso',
    type: FetchAllInvestmentsByPortfolioIdResponseDto,
    examples: {
      found: {
        summary: 'Investimentos encontrados',
        value: [
          {
            id: 'uuid-investment-123-456',
            assetId: 'uuid-asset-999-888',
            portfolioId: 'uuid-portfolio-789',
            investorId: 'uuid-123-456-789',
            quantity: 150,
            currentPrice: 32.50
          },
          {
            id: 'uuid-investment-456-123',
            assetId: 'uuid-asset-999-888',
            portfolioId: 'uuid-portfolio-789',
            investorId: 'uuid-123-456-789',
            quantity: 200,
            currentPrice: 57.96
          }
        ]
      },
      notFound: {
        summary: 'Investimento não encontrado',
        value: null
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Investidor não encontrado ou sem acesso ao portfólio',
    type: FetchAllInvestmentByPortfolioIdBusinessErrorDto,
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
    @Query("page") page: string,
  ): Promise<
    FetchAllInvestmentsByPortfolioIdResponseDto[]
  > {
    const result = await this.fetchAllInvestmentsByPortfolioIdService.execute({
      investorId,
      page: page ? Number(page) : 1,
    });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw new NotFoundException("Erro inesperado ao buscar investimentos");
    }

    const { investment } = result.value;

    return investment.map((inv) => 
        InvestmentPresenter.toHTTP(inv)
    );
  }
}
