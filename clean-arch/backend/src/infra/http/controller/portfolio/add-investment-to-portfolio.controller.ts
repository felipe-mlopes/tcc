import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { z } from "zod";

import { Public } from "@/infra/auth/public";
import { AddInvestmentToPortfolioService } from "@/domain/portfolio/services/add-investment-to-portfolio";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

const addInvestmentBodySchema = z.object({
  assetId: z.string().min(1),
  quantity: z.number().positive(),
  currentPrice: z.number().positive(),
});

type AddInvestmentBody = z.infer<typeof addInvestmentBodySchema>;

@Controller("/investor/:investorId/portfolio/investment")
@Public()
export class AddInvestmentToPortfolioController {
  constructor(private addInvestmentToPortfolioService: AddInvestmentToPortfolioService) {}

  @Post()
  async handle(
    @Param("investorId") investorId: string,
    @Body() body: AddInvestmentBody
  ): Promise<void> {
    const { assetId, quantity, currentPrice } = body;

    const result = await this.addInvestmentToPortfolioService.execute({
      investorId,
      assetId,
      quantity,
      currentPrice,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new BadRequestException("Unexpected error.");
      }
    }
  }
}
