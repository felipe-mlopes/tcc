import {
  Controller,
  Param,
  Patch,
  NotFoundException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { UpdateInvestmentAfterTransactionService } from "@/domain/portfolio/services/update-investment-after-transaction";
import { Public } from "@/infra/auth/public";
import { UpdateInvestmentAfterTransactionResponseDto } from "./dto/update-investment-after-transaction-response-dto";
import { UpdateInvestmentAfterTransactionBusinessErrorDto, UpdateInvestmentAfterTransactionForbiddenErrorDto } from "./dto/update-investment-after-transaction-error-response-dto";

@ApiTags('Portfolios')
@Controller("/:investorId/portfolio/investment/:transactionId/update")
@Public()
export class UpdateInvestmentAfterTransactionController {
  constructor(private updateInvestmentAfterTransactionService: UpdateInvestmentAfterTransactionService) {}

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar investimento após transação',
    description: `
    Atualiza os dados de investimento no portfólio após uma transação ser processada:
    - Recalcula quantidade total de cotas/ações do ativo
    - Atualiza valor médio de compra (preço médio ponderado)
    - Atualiza valor total atual do investimento
    - Registra histórico da transação no investimento
    - Operação automática que deve ser chamada após confirmação de transações
    - Apenas transações confirmadas e não processadas anteriormente são aceitas
    `
  })
  @ApiParam({
    name: 'investorId',
    description: 'ID único do investidor proprietário do investimento',
    example: 'uuid-123-456-789'
  })
  @ApiParam({
    name: 'transactionId',
    description: 'ID único da transação confirmada a ser processada',
    example: 'uuid-transaction-123-456'
  })
  @ApiOkResponse({
    description: 'Investimento atualizado com sucesso após processamento da transação',
    type: UpdateInvestmentAfterTransactionResponseDto,
    example: {
      message: 'Após a inclusão da transação, o investimento foi atualizado com sucesso'
    }
  })
  @ApiNotFoundResponse({
    description: 'Investidor, transação ou investimento não encontrados',
    type: UpdateInvestmentAfterTransactionBusinessErrorDto,
    examples: {
      investorNotFound: {
        summary: 'Investidor não encontrado',
        value: {
          statusCode: 404,
          message: 'Investidor não encontrado',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/portfolio/investment/uuid-transaction-123-456/update'
        }
      },
      transactionNotFound: {
        summary: 'Transação não encontrada',
        value: {
          statusCode: 404,
          message: 'Transação não encontrada',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/portfolio/investment/uuid-transaction-123-456/update'
        }
      },
      investmentNotFound: {
        summary: 'Investimento não encontrado',
        value: {
          statusCode: 404,
          message: 'Investimento não encontrado no portfólio',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/portfolio/investment/uuid-transaction-123-456/update'
        }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Operação não permitida - transação já processada ou status inválido',
    type: UpdateInvestmentAfterTransactionForbiddenErrorDto,
    examples: {
      alreadyProcessed: {
        summary: 'Transação já processada',
        value: {
          statusCode: 403,
          message: 'Transação já foi processada anteriormente',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/portfolio/investment/uuid-transaction-123-456/update'
        }
      },
      invalidStatus: {
        summary: 'Status inválido',
        value: {
          statusCode: 403,
          message: 'Transação não está em status válido para processamento',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/portfolio/investment/uuid-transaction-123-456/update'
        }
      },
      insufficientQuantity: {
        summary: 'Quantidade insuficiente para venda',
        value: {
          statusCode: 403,
          message: 'Quantidade insuficiente de ativos no portfólio para realizar a venda',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/portfolio/investment/uuid-transaction-123-456/update'
        }
      }
    }
  })
  async handle(
    @Param("investorId") investorId: string,
    @Param("transactionId") transactionId: string
  ): Promise<string> {
    const result = await this.updateInvestmentAfterTransactionService.execute({
      investorId,
      transactionId,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
          throw new ForbiddenException(error.message);
        default:
          throw new ForbiddenException("Erro inesperado ao processar transação");
      }
    }

    return result.value.message
  }
}
