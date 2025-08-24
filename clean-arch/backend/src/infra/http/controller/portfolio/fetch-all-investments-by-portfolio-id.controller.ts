import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { Public } from "@/infra/auth/public";
import { FetchAllInvestmentsByPortfolioIdService } from "@/domain/portfolio/services/fetch-all-investments-by-portfolio-id";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { InvestmentPresenter } from "@/infra/presenters/investment-presenter";

@Controller("/investor/:investorId/portfolio/investments")
@Public()
export class FetchAllInvestmentsByPortfolioIdController {
  constructor(
    private fetchAllInvestmentsByPortfolioIdService: FetchAllInvestmentsByPortfolioIdService,
  ) {}

  @Get()
  async handle(
    @Param("investorId") investorId: string,
    @Query("page") page: string,
  ): Promise<
    {
      id: string;
      assetId: string;
      portfolioId: string;
      quantity: number;
      currentPrice: number;
    }[]
  > {
    const result = await this.fetchAllInvestmentsByPortfolioIdService.execute({
      investorId,
      page: page ? Number(page) : 1,
    });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw new NotFoundException("Unexpected error.");
    }

    const { investment } = result.value;

    return investment.map((inv) => 
        InvestmentPresenter.toHTTP(inv)
    );
  }
}
