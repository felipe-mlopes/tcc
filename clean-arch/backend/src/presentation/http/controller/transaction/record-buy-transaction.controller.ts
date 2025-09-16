import {
  Body,
  Controller,
  Post,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Res,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Response } from 'express';

import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error";

import { RecordBuyTransactionService } from "@/domain/transaction/services/record-buy-transaction";
import { TransactionType } from "@/domain/transaction/entities/transaction";

import { CurrentUser } from "@/infra/auth/current-user.decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";

import { RecordTransactionDto } from "./dto/record-transaction-dto";
import { RecordBuyTransactionResponseDto } from "./dto/record-buy-transaction-response-dto";
import { RecordTransactionBusinessErrorDto, RecordTransactionValidationErrorDto } from "./dto/record-transaction-error-response-dto";

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller("/transactions/buy")
export class RecordBuyTransactionController {
  constructor(
    readonly recordBuyTransactionService: RecordBuyTransactionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar transação de compra',
    description: `
    Registra uma nova transação de compra de ativo para o investidor:
    - ID do ativo: 
    - Quantidade: Número de cotas/ações compradas (deve ser positivo)
    - Preço: Valor unitário pago pelo ativo (deve ser positivo)
    - Taxas: Custos adicionais da operação (corretagem, custódia) - OPCIONAL
    - Data: Data e hora em que a transação foi executada
    - Transação será registrada com status pendente aguardando confirmação
    - Após confirmação, o portfólio será automaticamente atualizado
    - **Requer autenticação**: Token JWT no header Authorization
    `
  })
  @ApiBody({
    type: RecordTransactionDto,
    description: 'Dados necessários para registrar a transação de compra',
    examples: {
      stock: {
        summary: 'Compra de ação',
        description: 'Exemplo de compra de ações com taxas',
        value: {
          assetId: 'uuid-123-456-258',
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
          assetId: 'uuid-123-456-789',
          quantity: 1000,
          price: 1.25,
          dateAt: '2024-01-15T09:00:00Z'
        }
      },
      crypto: {
        summary: 'Compra de criptomoeda',
        description: 'Exemplo de compra de criptomoeda',
        value: {
          assetId: 'uuid-123-456-000',
          quantity: 0.05,
          price: 150000.00,
          fees: 75.00,
          dateAt: '2024-01-15T16:45:00Z'
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Transação de compra registrada',
    type: RecordBuyTransactionResponseDto,
    example: {
      message: 'A transação de compra foi registrada com sucesso'
    },
    headers: {
      Location: {
        description: 'URL da transação de compra criada',
        schema: {
          type: 'string',
          example: '/transactions/buy/uuid-123-456-789'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
      description: 'Token JWT não fornecido ou inválido',
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        timestamp: '2024-01-15T10:30:00Z',
        path: '/transactions/buy'
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
          path: '/transactions/buy'
        }
      },
      quantityValidation: {
        summary: 'Quantidade inválida',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['quantity: Quantidade deve ser um número positivo'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/transactions/buy'
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
          path: '/transactions/buy'
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
      path: '/transactions/buy'
    }
  })
  async handle(
    @Body()body: RecordTransactionDto,
    @CurrentUser() user: UserPayload,
    @Res({ passthrough: true }) res: Response
  ): Promise<RecordBuyTransactionResponseDto> {
    const { assetId, quantity, price, fees, dateAt } = body;
    const investorId = user.sub

    const result = await this.recordBuyTransactionService.execute({
      investorId,
      assetId,
      transactionType: TransactionType.Buy,
      quantity,
      price,
      fees,
      dateAt,
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

    const transactionId = result.value.id
    res.setHeader('Location', `/transactions/buy/${transactionId}`)

    return {
      message: result.value.message
    }
  }
}
