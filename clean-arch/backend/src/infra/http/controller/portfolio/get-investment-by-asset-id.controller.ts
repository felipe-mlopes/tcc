import {
  Controller,
  Get,
  Param,
  NotFoundException,
} from "@nestjs/common";
import { Public } from "@/infra/auth/public";
import { GetInvestmentByAssetIdService } from "@/domain/portfolio/services/get-investment-by-asset-id";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { InvestmentPresenter } from "@/infra/presenters/investment-presenter";

@Controller("/investor/:investorId/portfolio/investment/:assetId")
@Public()
export class GetInvestmentByAssetIdController {
  constructor(private getInvestmentByAssetIdService: GetInvestmentByAssetIdService) {}

  @Get()
  async handle(
    @Param("investorId") investorId: string,
    @Param("assetId") assetId: string,
  ): Promise<{
    id: string;
    assetId: string;
    portfolioId: string;
    quantity: number;
    currentPrice: number;
  } | null> {
    const result = await this.getInvestmentByAssetIdService.execute({
      investorId,
      assetId,
    });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw new NotFoundException("Unexpected error.");
    }

    const { investment } = result.value;

    if (!investment) {
      return null;
    }

    return InvestmentPresenter.toHTTP(investment);
  }
}
