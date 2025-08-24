import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
} from "@nestjs/common";

import { Public } from "@/infra/auth/public";
import { UpdateInvestorService } from "@/domain/investor/services/update-investor";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { UpdateInvestorDto } from "./dto/update-investor-dto";
import { UpdateInvestorResponseDto } from "./dto/update-investor-response-dto";
import { UpdateInvestorBusinessErrorDto, UpdateInvestorNotFoundErrorDto, UpdateInvestorValidationErrorDto } from "./dto/update-investor-error-response-dto";

@ApiTags('Investors')
@Controller("/investor")
@Public()
export class UpdateInvestorController {
  constructor(private updateInvestorService: UpdateInvestorService) {}

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Atualizar investidor',
    description: `
      Atualiza os dados de um investidor existente no sistema usando Value Objects para validações:
      - Email: Validado pela classe Email (formato padrão) - OPCIONAL
      - Nome: Validado pela classe Name (mín. 2 chars, letras, espaços, hífens, pontos, números) - OPCIONAL
      - Pelo menos um campo deve ser fornecido para atualização
      - CPF e data de nascimento não podem ser alterados
    `
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID único do investidor a ser atualizado',
    example: 'uuid-123-456-789'
  })
  @ApiBody({
    type: UpdateInvestorDto,
    description: 'Dados que podem ser atualizados do investidor',
    examples: {
      valid: {
        summary: 'Dados válidos',
        description: 'Exemplo de atualização de investidor',
        value: {
          name: 'João Silva Santos',
          email: 'joao.silva@email.com'
        }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'Investidor atualizado com sucesso.',
    type: UpdateInvestorResponseDto,
    example: {
      message: 'O cadastro do investidor foi atualizado com sucesso'
    }
  })
  @ApiBadRequestResponse({
    description: 'Dados de entrada inválidos ou erro de validação',
    type: UpdateInvestorValidationErrorDto,
    example: {
      noFields: {
        summary: 'Nenhum campo fornecido',
        description: 'Erro quando nenhum campo é fornecido para atualização',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: ['body: Pelo menos um campo deve ser fornecido para atualização (name ou email)'],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789'
        }
      },
      multipleErrors: {
        summary: 'Múltiplos erros',
        description: 'Exemplo com vários campos inválidos',
        value: {
          statusCode: 400,
          message: 'Validation failed',
          details: [
            'email: Email deve ter um formato válido',
            'name: Nome deve ter pelo menos 2 caracteres e conter apenas letras, espaços, hífens, pontos e números'
          ],
          timestamp: '2024-01-15T10:30:00Z',
          path: '/investor/uuid-123-456-789'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Investidor não encontrado',
    type: UpdateInvestorNotFoundErrorDto,
    example: {
      statusCode: 404,
      message: 'Investidor não encontrado',
      timestamp: '2024-01-15T10:30:00Z',
      path: '/investor/uuid-123-456-789'
    }
  })
  @ApiConflictResponse({
    description: 'Conflito - Email já está em uso',
    type: UpdateInvestorBusinessErrorDto,
    example: {
      statusCode: 409,
      message: 'Email já está em uso por outro investidor',
      timestamp: '2024-01-15T10:30:00Z',
      path: '/investor/uuid-123-456-789'
    }
  })
  async handle(
    @Param("id") investorId: string,
    @Body() body: UpdateInvestorDto
  ): Promise<string> {
    const { name, email } = body;

    const result = await this.updateInvestorService.execute({
      investorId,
      name,
      email,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
          if (error.message.includes('já existe') || 
              error.message.includes('already exists') ||
              error.message.includes('já está em uso') ||
              error.message.includes('already in use')) {
            throw new ConflictException(error.message);
          }
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException('Erro inesperado ao atualizar investidor');
      }
    }

    return result.value.message
  }
}
