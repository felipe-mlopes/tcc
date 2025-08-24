import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { UpdateTransactionService } from "@/domain/transaction/services/update-transaction";
import { Public } from "@/infra/auth/public";
import { UpdateTransactionDto } from "./dto/update-transaction-dto";
import { UpdateTransactionNotFoundErrorDto, UpdateTransactionValidationErrorDto } from "./dto/update-transaction-error-response-dto";
import { UpdateTransactionResponseDto } from "./dto/update-transaction-response-dto";

@ApiTags('Transactions')
@Controller("/:investorId/transaction")
@Public()
export class UpdateTransactionController {
  constructor(private updateTransactionService: UpdateTransactionService) {}

  @Patch(":transactionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar transação existente',
    description: `
    Atualiza os dados de uma transação existente no sistema:
    - Tipo de transação: Pode alterar entre BUY (compra) e SELL (venda) - OPCIONAL
    - Quantidade: Nova quantidade de cotas/ações (deve ser positivo) - OPCIONAL
    - Preço: Novo preço unitário (deve ser positivo) - OPCIONAL
    - Taxas: Novos custos da operação (mínimo 0) - OPCIONAL
    - Pelo menos um campo deve ser fornecido para atualização
    - Apenas transações com status PENDING podem ser alteradas
    - Transações confirmadas ou canceladas não podem ser modificadas
    `
  })
  @ApiParam({
    name: 'investorId',
    type: 'string',
    description: 'ID único do investidor proprietário da transação',
    example: 'uuid-123-456-789'
  })
  @ApiParam({
    name: 'transactionId',
    type: 'string',
    description: 'ID único da transação a ser atualizada',
    example: 'uuid-transaction-123-456'
  })
  @ApiBody({
    type: UpdateTransactionDto,
    description: 'Dados que podem ser atualizados na transação',
    examples: {
      priceUpdate: {
        summary: 'Atualizar preço',
        description: 'Exemplo atualizando apenas o preço da transação',
        value: {
          price: 32.75
        }
      },
      quantityAndFees: {
        summary: 'Atualizar quantidade e taxas',
        description: 'Exemplo atualizando quantidade e taxas',
        value: {
          quantity: 150,
          fees: 15.50
        }
      },
      changeType: {
        summary: 'Alterar tipo da transação',
        description: 'Exemplo alterando de compra para venda',
        value: {
          transactionType: 'SELL',
          price: 31.20,
          fees: 0
        }
      },
      complete: {
        summary: 'Atualização completa',
        description: 'Exemplo atualizando todos os campos',
        value: {
          transactionType: 'BUY',
          quantity: 200,
          price: 29.85,
          fees: 18.75
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Transação atualizada com sucesso',
    type: UpdateTransactionResponseDto,
    example: {
      message: 'Transação atualizada com sucesso'
    }
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos, erro de validação ou regra de negócio',
    type: UpdateTransactionValidationErrorDto,
    examples: {
      noFields: {
        summary: 'Nenhum campo fornecido',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['body: Pelo menos um campo deve ser fornecido para atualização'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/uuid-123-456-789/transaction/uuid-transaction-123-456'
        }
      },
      invalidValues: {
        summary: 'Valores inválidos',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: [
            'quantity: Quantidade deve ser um número positivo',
            'price: Preço deve ser um número positivo'
          ],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/uuid-123-456-789/transaction/uuid-transaction-123-456'
        }
      },
      statusNotAllowed: {
        summary: 'Status não permite alteração',
        value: {
          statusCode: 400,
          message: 'Transação já confirmada não pode ser alterada',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/uuid-123-456-789/transaction/uuid-transaction-123-456'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Investidor ou transação não encontrados',
    type: UpdateTransactionNotFoundErrorDto,
    examples: {
      investorNotFound: {
        summary: 'Investidor não encontrado',
        value: {
          statusCode: 404,
          message: 'Investidor não encontrado',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/uuid-123-456-789/transaction/uuid-transaction-123-456'
        }
      },
      transactionNotFound: {
        summary: 'Transação não encontrada',
        value: {
          statusCode: 404,
          message: 'Transação não encontrada',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/uuid-123-456-789/transaction/uuid-transaction-123-456'
        }
      }
    }
  })
  async handle(
    @Param("investorId") investorId: string,
    @Param("transactionId") transactionId: string,
    @Body() body: UpdateTransactionDto
  ): Promise<string> {
    const { transactionType, quantity, price, fees } = body;

    const result = await this.updateTransactionService.execute({
      investorId,
      transactionId,
      transactionType,
      quantity,
      price,
      fees,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException("Erro inesperado ao atualizar transação");
      }
    }

    return result.value.message
  }
}