import { 
    BadRequestException, 
    Body, 
    Controller, 
    HttpCode, 
    HttpStatus, 
    NotFoundException, 
    Post, 
    Res 
} from "@nestjs/common";
import { 
    ApiBadRequestResponse, 
    ApiBody, 
    ApiCreatedResponse, 
    ApiNotFoundResponse, 
    ApiOperation, 
    ApiTags 
} from "@nestjs/swagger";
import { Response } from 'express';

import { RegisterAssetService } from "@/domain/asset/services/register-asset";
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error";
import { Public } from "@/infra/auth/public";
import { RegisterAssetDto } from "./dto/register-asset-dto";
import { RegisterAssetResponseDto } from "./dto/register-asset-response-dto";
import { RegisterAssetErrorResponseDto } from "./dto/register-asset-error-response.dto";

@ApiTags('Assets')
@Controller('/asset')
@Public()
export class RegisterAssetController {
    constructor(readonly registerAssetService: RegisterAssetService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ 
        summary: 'Criar novo ativo',
        description: `Cria um novo ativo no sistema com validações completas de dados`
    })
    @ApiBody({
        type: RegisterAssetDto,
        description: 'Dados necessários para criar um novo ativo',
        examples: {
            stock: {
                summary: 'Ação',
                description: 'Exemplo de criação de uma ação',
                value: {
                    symbol: 'AAPL',
                    name: 'Apple Inc.',
                    assetType: 'STOCK',
                    sector: 'Technology',
                    exchange: 'NASDAQ',
                    currency: 'USD'
                }
            }
        }
    })
    @ApiCreatedResponse({
        description: 'Ativo criado com sucesso',
        type: RegisterAssetResponseDto,
        example: {
            message: 'O cadastro do ativo foi realizado com sucesso'
        },
        headers: {
            Location: {
                description: 'URL do ativo criado',
                schema: {
                    type: 'string',
                    example: '/asset/uuid-123-456-789'
                }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'Dados inválidos fornecidos',
        type: RegisterAssetErrorResponseDto,
        example: {
        statusCode: 400,
        message: 'Validation failed',
        timestamp: '2024-01-15T10:30:00Z',
        path: '/asset',
        details: [
            'symbol must be at least 3 characters',
            'currency must be exactly 3 characters'
        ]
        }
    })
    @ApiNotFoundResponse({
        description: 'Recurso não encontrado',
        type: RegisterAssetErrorResponseDto,
        example: {
        statusCode: 404,
        message: 'Resource not found',
        timestamp: '2024-01-15T10:30:00Z',
        path: '/asset'
        }
    })
    async handle(
        @Body() body: RegisterAssetDto,
        @Res({ passthrough: true }) res: Response
    ): Promise<RegisterAssetResponseDto> {
        const { name, symbol, assetType, sector, exchange, currency } = body

        const result = await this.registerAssetService.execute({
            name,
            symbol,
            assetType,
            sector,
            exchange,
            currency
        })

        if (result.isLeft()) {
            const error = result.value

            switch (error.constructor) {
                case ResourceNotFoundError:
                    throw new NotFoundException(error.message)
                default:
                    throw new BadRequestException()
            }
        }

        const assetId = result.value.id
        res.setHeader('Location', `/asset/${assetId}`);

        return {
            message: result.value.message,
        }
    }
}