import {
  Controller,
  Param,
  Patch,
  NotFoundException,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";

import { Public } from "@/infra/auth/public";
import { DeactivateInvestorService } from "@/domain/investor/services/deactivate-investor";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { DeactivateInvestorResponseDto } from "./dto/deactivate-investor-response-dto";
import { DeactivateInvestorNotFoundErrorDto } from "./dto/deactivate-investor-error-response-dto";
import { NotAllowedError } from "@/core/errors/not-allowed-error";

@ApiTags('Investors')
@Controller("/investor")
@Public()
export class DeactivateInvestorController {
  constructor(private desactiveInvestorService: DeactivateInvestorService) {}

  @Patch(":id/desactive")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Desativar investidor',
    description: `
      Desativa um investidor existente no sistema.
      
      Funcionalidades:
      - Marca o investidor como inativo
      - Mantém os dados históricos
      - Impede novas operações do investidor
      - Operação irreversível (requer reativação manual se necessário)
      
      Regras de negócio:
      - Investidor deve existir no sistema
      - Investidor não pode estar já desativado
      - Investidor não pode ter operações pendentes (se aplicável)
    `
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID único do investidor a ser desativado',
    example: 'uuid-123-456-789'
  })
  @ApiOkResponse({
    description: 'Investidor desativado com sucesso',
    type: DeactivateInvestorResponseDto,
    examples: {
      success: {
        summary: 'Desativação bem-sucedida',
        value: {
          message: 'Investidor desativado com sucesso',
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Investidor não encontrado no sistema',
    type: DeactivateInvestorNotFoundErrorDto,
    examples: {
      notFound: {
        summary: 'Investidor não existe',
        value: {
          statusCode: 404,
          message: 'Investidor não encontrado',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-inexistente/deactivate'
        }
      },
      invalidId: {
        summary: 'ID inválido',
        value: {
          statusCode: 404,
          message: 'Investidor com ID inválido não encontrado',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/id-invalido/deactivate'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Erro de regra de negócio ou estado inválido',
    type: DeactivateInvestorNotFoundErrorDto,
    examples: {
      alreadyInactive: {
        summary: 'Já desativado',
        value: {
          statusCode: 400,
          message: 'Investidor já está desativado',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789/deactivate'
        }
      }
    }
  })
  async handle(@Param("id") investorId: string): Promise<{ message: string }> {
    const result = await this.desactiveInvestorService.execute({
      investorId,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException('Erro inesperado ao desativar investidor');
      }
    }

    return result.value;
  }
}
