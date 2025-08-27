import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { FetchTransactionsHistoryByAssetIdService } from "@/domain/transaction/services/fetch-transactions-history-by-asset-id";
import { TransactionPresenter } from "@/infra/presenters/transaction-presenter";
import { FetchAllTransactionsHistoryResponseDto, FetchTransactionsHistoryWrapperDto } from "./dto/fetch-transactions-history-response-dto";
import { FetchAllTransactionsHistoryByAssetIdBusinessErrorDto } from "./dto/fetch-transactions-history-by-asset-id-error-response-dto";
import { CurrentUser } from "@/infra/auth/current-user.decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller("/asset/:assetId/transactions")
export class FetchTransactionsHistoryByAssetIdController {
  constructor(
    private fetchTransactionsHistoryByAssetIdService: FetchTransactionsHistoryByAssetIdService
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar transações por ID do ativo',
    description: `
      Busca os transações realizadas no portfólio do investidor baseado no ID do ativo:
      - Retorna informações dos transações se encontrado
      - Inclui quantidade e preço transacionados
      - Retorna null se o investidor não possui nenhum investimento
      - **Requer autenticação**: Token JWT no header Authorization
    `
  })
  @ApiParam({
    name: 'assetId',
    description: 'ID único do ativo',
    example: 'uuid-asset-456-789'
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
    description: 'Transações encontradas com sucesso',
    type: FetchAllTransactionsHistoryResponseDto,
    examples: {
      transactions: {
        summary: 'Transações encontradas',
        value: [
          {
            id: 'uuid-transaction-123-456',
            assetId: 'uuid-asset-999-888',
            portfolioId: 'uuid-portfolio-789',
            quantity: 400,
            price: 32.50,
            transactionType: 'Buy',
            dateAt: '2024-06-10T14:30:00.000Z'
          },
          {
            id: 'uuid-transaction-456-123',
            assetId: 'uuid-asset-999-888',
            portfolioId: 'uuid-portfolio-789',
            quantity: 200,
            price: 10.30,
            transactionType: 'Sell',
            dateAt: '2024-06-10T14:30:00.000Z'
          }
        ]
      },
      notFound: {
        summary: 'Transação não encontrada',
        value: null
      }
    }
  })
  @ApiUnauthorizedResponse({
      description: 'Token JWT não fornecido ou inválido',
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        timestamp: '2024-01-15T10:30:00Z',
        path: '/asset/uuid-asset-999-888/transactions'
      }
  })
  @ApiNotFoundResponse({
    description: 'Investidor não encontrado',
    type: FetchAllTransactionsHistoryByAssetIdBusinessErrorDto,
    examples: {
      investorNotFound: {
        summary: 'Investidor não encontrado',
        value: {
          statusCode: 404,
          message: 'Investidor não encontrado',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/asset/uuid-asset-999-888/transactions'
        }
      }
    }
  })
  async handle(
    @Param("assetId") assetId: string,
    @Query("page") page: string,
    @CurrentUser() user: UserPayload
  ): Promise<FetchTransactionsHistoryWrapperDto> {
    const investorId = user.sub

    const result = await this.fetchTransactionsHistoryByAssetIdService.execute({
      investorId,
      assetId,
      page: page ? Number(page) : 1,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException("Unexpected error.");
      }
    }

    const { transactions } = result.value;

    return {
      transactions: transactions.map((transaction) => {
        const httpTransaction = TransactionPresenter.toHTTP(transaction);
        return {
          ...httpTransaction,
          transactionType: httpTransaction.type
        };
      }),
    };
  }
}