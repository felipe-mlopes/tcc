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
import { RegisterInvestmentGoalService } from "@/domain/goal/services/register-investment-goal";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { RegisterInvestmentGoalDto } from "./dto/register-investment-goal-dto";
import { RegisterInvestmentGoalResponseDto } from "./dto/register-investment-goal-response-dto";
import { RegisterInvestmentGoalBusinessErrorDto, RegisterInvestmentGoalValidationErrorDto } from "./dto/register-investment-goal-error-response-dto";

@ApiTags('Goals')
@Controller("/:investorId/goals")
@Public()
export class RegisterInvestmentGoalController {
  constructor(private registerInvestmentGoalService: RegisterInvestmentGoalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nova meta de investimento',
    description: `
    Cria uma nova meta de investimento para um investidor específico:
    - Nome: Mínimo 3 caracteres
    - Descrição: Campo opcional
    - Valor alvo: Deve ser um valor positivo
    - Data alvo: Data futura para alcançar a meta
    - Prioridade: Alta, Média ou Baixa
    `
  })
  @ApiParam({
    name: 'investorId',
    description: 'ID único do investidor',
    example: 'uuid-123-456-789'
  })
  @ApiBody({
    type: RegisterInvestmentGoalDto,
    description: 'Dados necessários para registrar uma nova meta de investimento',
    examples: {
      valid: {
        summary: 'Dados válidos',
        description: 'Exemplo com todos os campos preenchidos corretamente',
        value: {
          name: 'Comprar casa própria',
          description: 'Meta para conseguir dar entrada na casa própria',
          targetAmount: 150000.00,
          targetDate: '2025-12-31',
          priority: 'HIGH'
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Meta de investimento registrada com sucesso',
    type: RegisterInvestmentGoalResponseDto,
    example: {
      message: 'A meta de investimento foi cadastrada com sucesso',
    }
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos ou erro de validação',
    type: RegisterInvestmentGoalValidationErrorDto,
    examples: {
      nameValidation: {
        summary: 'Nome muito curto',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['name: Nome deve ter pelo menos 3 caracteres'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/goals'
        }
      },
      amountValidation: {
        summary: 'Valor inválido',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['targetAmount: Valor alvo deve ser positivo'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/goals'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Investidor não encontrado',
    type: RegisterInvestmentGoalBusinessErrorDto,
    example: {
      statusCode: 404,
      message: 'Investidor não encontrado',
      timestamp: '2024-01-15T10:30:00Z',
      path: '/investor/uuid-123-456-789/goals'
    }
  })
  async handle(
    @Param("investorId") investorId: string,
    @Body() body: RegisterInvestmentGoalDto
  ): Promise<string> {
    const { name, description, targetAmount, targetDate, priority } = body;

    const result = await this.registerInvestmentGoalService.execute({
      investorId,
      name,
      description,
      targetAmount,
      targetDate,
      priority,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException("Erro inesperado ao registrar meta de investimento");
      }
    }

    return result.value.message
  }
}