import {
  Controller,
  Patch,
  NotFoundException,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { 
  ApiBadRequestResponse, 
  ApiBearerAuth, 
  ApiNotFoundResponse, 
  ApiOkResponse, 
  ApiOperation, 
  ApiTags, 
  ApiUnauthorizedResponse 
} from "@nestjs/swagger";

import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error";
import { NotAllowedError } from "@/shared/exceptions/errors/not-allowed-error";
import { DeactivateInvestorService } from "@/domain/investor/services/deactivate-investor";
import { DeactivateInvestorResponseDto } from "./dto/deactivate-investor-response-dto";
import { DeactivateInvestorNotFoundErrorDto } from "./dto/deactivate-investor-error-response-dto";
import { CurrentUser } from "@/infra/auth/current-user.decorator";
import { UserPayload } from "@/infra/auth/jwt.strategy";

@ApiTags('Investors')
@ApiBearerAuth()
@Controller("/investor")
export class DeactivateInvestorController {
  constructor(readonly desactiveInvestorService: DeactivateInvestorService) {}

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
      - **Requer autenticação**: Token JWT no header Authorization
    `
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
  @ApiUnauthorizedResponse({
      description: 'Token JWT não fornecido ou inválido',
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        timestamp: '2024-01-15T10:30:00Z',
        path: '/investor/deactivate'
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
          path: '/investor/deactivate'
        }
      },
      invalidId: {
        summary: 'ID inválido',
        value: {
          statusCode: 404,
          message: 'Investidor com ID inválido não encontrado',
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/deactivate'
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
          path: '/investor/deactivate'
        }
      }
    }
  })
  async handle(
    @CurrentUser() user: UserPayload,
  ): Promise<DeactivateInvestorResponseDto> {
    const investorId = user.sub

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

    return {
      message: result.value.message
    }
  }
}
