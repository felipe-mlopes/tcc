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
import { UpdateInvestmentGoalService } from "@/domain/goal/services/update-investment-goal";
import { Public } from "@/infra/auth/public";
import { UpdateInvestmentGoalDto } from "./dto/update-investment-goal-dto";
import { UpdateInvestmentGoalResponseDto } from "./dto/update-investment-goal-response-dto";
import { UpdateInvestmentGoalNotFoundErrorDto, UpdateInvestmentGoalValidationErrorDto } from "./dto/update-investment-goal-error-response-dto";

@ApiTags('Goals')
@Controller("/:investorId/goals")
@Public()
export class UpdateInvestmentGoalController {
  constructor(private updateInvestmentGoalService: UpdateInvestmentGoalService) {}

  @Patch(":goalId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atualizar meta de investimento',
    description: `
      Atualiza os dados de uma meta de investimento existente:
      - Nome: Mínimo 3 caracteres - OPCIONAL
      - Descrição: Campo opcional - OPCIONAL
      - Valor alvo: Deve ser um valor positivo - OPCIONAL
      - Data alvo: Data futura para alcançar a meta - OPCIONAL
      - Prioridade: Alta, Média ou Baixa - OPCIONAL
      - Status: Ativo, Pausado, Concluído ou Cancelado - OPCIONAL
      - Pelo menos um campo deve ser fornecido para atualização
    `
  })
  @ApiParam({
    name: 'investorId',
    type: 'string',
    description: 'ID único do investidor proprietário da meta',
    example: 'uuid-123-456-789'
  })
  @ApiParam({
    name: 'goalId',
    type: 'string',
    description: 'ID único da meta de investimento a ser atualizada',
    example: 'uuid-goal-123-456'
  })
  @ApiBody({
    type: UpdateInvestmentGoalDto,
    description: 'Dados que podem ser atualizados da meta de investimento',
    examples: {
      valid: {
        summary: 'Dados válidos',
        description: 'Exemplo de atualização de meta de investimento',
        value: {
          name: 'Comprar apartamento novo',
          description: 'Meta atualizada para comprar apartamento de 2 quartos',
          targetAmount: 200000.00,
          priority: 'HIGH'
        }
      },
      statusUpdate: {
        summary: 'Atualização de status',
        description: 'Exemplo atualizando apenas o status da meta',
        value: {
          status: 'COMPLETED'
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Meta de investimento atualizada com sucesso',
    type: UpdateInvestmentGoalResponseDto,
    example: {
      message: 'Meta de investimento atualizada com sucesso'
    }
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos ou erro de validação',
    type: UpdateInvestmentGoalValidationErrorDto,
    examples: {
      noFields: {
        summary: 'Nenhum campo fornecido',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['body: Pelo menos um campo deve ser fornecido para atualização'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/goals/uuid-goal-123-456'
        }
      },
      multipleErrors: {
        summary: 'Múltiplos erros',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: [
            'name: Nome deve ter pelo menos 3 caracteres',
            'targetAmount: Valor alvo deve ser positivo',
            'targetDate: Data alvo deve ser no futuro'
          ],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/goals/uuid-goal-123-456'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Investidor ou meta não encontrados',
    type: UpdateInvestmentGoalNotFoundErrorDto,
    examples: {
      investorNotFound: {
        summary: 'Investidor não encontrado',
        value: {
          statusCode: 404,
          message: 'Investidor não encontrado',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/goals/uuid-goal-123-456'
        }
      },
      goalNotFound: {
        summary: 'Meta não encontrada',
        value: {
          statusCode: 404,
          message: 'Meta de investimento não encontrada',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/goals/uuid-goal-123-456'
        }
      }
    }
  })
  async handle(
    @Param("investorId") investorId: string,
    @Param("goalId") goalId: string,
    @Body() body: UpdateInvestmentGoalDto
  ): Promise<string> {
    const { name, description, targetAmount, targetDate, priority, status } = body;

    const result = await this.updateInvestmentGoalService.execute({
      investorId,
      goalId,
      name,
      description,
      targetAmount,
      targetDate,
      priority,
      status,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException("Erro inesperado ao atualizar meta de investimento");
      }
    }

    return result.value.message
  }
}