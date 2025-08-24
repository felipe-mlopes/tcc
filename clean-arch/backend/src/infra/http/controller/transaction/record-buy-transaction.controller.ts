import {
  Body,
  Controller,
  Post,
  Param,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { RecordBuyTransactionService } from "@/domain/transaction/services/record-buy-transaction";
import { TransactionType } from "@/domain/transaction/entities/transaction";
import { Public } from "@/infra/auth/public";
import { RecordTransactionDto } from "./dto/record-transaction-dto";
import { RecordBuyTransactionResponseDto } from "./dto/record-buy-transaction-response-dto";
import { RecordTransactionBusinessErrorDto, RecordTransactionValidationErrorDto } from "./dto/record-transaction-error-response-dto";

@ApiTags('Transactions')
@Controller("/:investorId/transactions/buy")
@Public()
export class RecordBuyTransactionController {
  constructor(
    private recordBuyTransactionService: RecordBuyTransactionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar transação de compra',
    description: `
    Registra uma nova transação de compra de ativo para o investidor:
    - Nome do ativo: Mínimo 3 caracteres (ex: PETR4, VALE3, etc)
    - Quantidade: Número de cotas/ações compradas (deve ser positivo)
    - Preço: Valor unitário pago pelo ativo (deve ser positivo)
    - Taxas: Custos adicionais da operação (corretagem, custódia) - OPCIONAL
    - Data: Data e hora em que a transação foi executada
    - Transação será registrada com status pendente aguardando confirmação
    - Após confirmação, o portfólio será automaticamente atualizado
    `
  })
  @ApiParam({
    name: 'investorId',
    description: 'ID único do investidor que realizou a compra',
    example: 'uuid-123-456-789'
  })
  @ApiBody({
    type: RecordTransactionDto,
    description: 'Dados necessários para registrar a transação de compra',
    examples: {
      stock: {
        summary: 'Compra de ação',
        description: 'Exemplo de compra de ações com taxas',
        value: {
          assetName: 'PETR4',
          quantity: 100,
          price: 28.50,
          fees: 12.90,
          dateAt: '2024-01-15T14:30:00Z'
        }
      },
      fund: {
        summary: 'Compra de fundo',
        description: 'Exemplo de aplicação em fundo sem taxas',
        value: {
          assetName: 'FUND-XP-DI',
          quantity: 1000,
          price: 1.25,
          dateAt: '2024-01-15T09:00:00Z'
        }
      },
      crypto: {
        summary: 'Compra de criptomoeda',
        description: 'Exemplo de compra de criptomoeda',
        value: {
          assetName: 'BTC',
          quantity: 0.05,
          price: 150000.00,
          fees: 75.00,
          dateAt: '2024-01-15T16:45:00Z'
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Transação de compra registrada com sucesso',
    type: RecordBuyTransactionResponseDto,
    example: {
      message: 'Transação de compra registrada com sucesso'
    }
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos ou erro de validação',
    type: RecordTransactionValidationErrorDto,
    examples: {
      assetNameValidation: {
        summary: 'Nome do ativo inválido',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['assetName: Nome do ativo deve ter pelo menos 3 caracteres'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/uuid-123-456-789/transactions/buy'
        }
      },
      quantityValidation: {
        summary: 'Quantidade inválida',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['quantity: Quantidade deve ser um número positivo'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/uuid-123-456-789/transactions/buy'
        }
      },
      multipleErrors: {
        summary: 'Múltiplos erros',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: [
            'assetName: Nome do ativo deve ter pelo menos 3 caracteres',
            'quantity: Quantidade deve ser um número positivo',
            'price: Preço deve ser um número positivo'
          ],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/uuid-123-456-789/transactions/buy'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Investidor não encontrado',
    type: RecordTransactionBusinessErrorDto,
    example: {
      statusCode: 404,
      message: 'Investidor não encontrado',
      timestamp: '2024-01-15T10:30:00Z',
      path: '/uuid-123-456-789/transactions/buy'
    }
  })
  async handle(
    @Param("investorId") investorId: string,
    @Body()body: RecordTransactionDto
  ): Promise<string> {
    const { assetName, quantity, price, fees, dateAt } = body;

    const result = await this.recordBuyTransactionService.execute({
      investorId,
      assetName,
      transactionType: TransactionType.Buy,
      quantity,
      price,
      fees,
      dateAt: new Date(dateAt),
    });

    if (result.isLeft()) {
      const error = result.value;
      
      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException("Erro inesperado ao registrar transação de compra");
      }
    }

    return result.value.message
  }
}
