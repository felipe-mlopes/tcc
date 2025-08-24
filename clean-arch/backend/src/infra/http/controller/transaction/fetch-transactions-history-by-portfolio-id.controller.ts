import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";

import { Public } from "@/infra/auth/public";
import { FetchTransactionsHistoryByPorfolioIdService } from "@/domain/transaction/services/fetch-transactions-history-by-portfolio-id";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { TransactionPresenter } from "@/infra/presenters/transaction-presenter";

const fetchTransactionsHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
});

type FetchTransactionsHistoryQuery = z.infer<typeof fetchTransactionsHistoryQuerySchema>;

@Controller("/investor/:investorId/transactions")
@Public()
export class FetchTransactionsHistoryByPortfolioIdController {
  constructor(
    private fetchTransactionsHistoryByPortfolioIdService: FetchTransactionsHistoryByPorfolioIdService
  ) {}

  @Get()
  async handle(
    @Param("investorId") investorId: string,
    @Query() query: FetchTransactionsHistoryQuery
  ) {
    const { page } = fetchTransactionsHistoryQuerySchema.parse(query);

    const result = await this.fetchTransactionsHistoryByPortfolioIdService.execute({
      investorId,
      page,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException("Unexpected error.");
      }
    }

    const { transactions } = result.value;

    return {
      transactions: transactions.map((transaction) => (
            TransactionPresenter.toHTTP(transaction)
      )),
    };
  }
}