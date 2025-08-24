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
import { FetchTransactionsHistoryByAssetIdService } from "@/domain/transaction/services/fetch-transactions-history-by-asset-id";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { TransactionPresenter } from "@/infra/presenters/transaction-presenter";

const fetchTransactionsHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
});

type FetchTransactionsHistoryQuery = z.infer<typeof fetchTransactionsHistoryQuerySchema>;

@Controller("/investor/:investorId/asset/:assetId/transactions")
@Public()
export class FetchTransactionsHistoryByAssetIdController {
  constructor(
    private fetchTransactionsHistoryByAssetIdService: FetchTransactionsHistoryByAssetIdService
  ) {}

  @Get()
  async handle(
    @Param("investorId") investorId: string,
    @Param("assetId") assetId: string,
    @Query() query: FetchTransactionsHistoryQuery
  ) {
    const { page } = fetchTransactionsHistoryQuerySchema.parse(query);

    const result = await this.fetchTransactionsHistoryByAssetIdService.execute({
      investorId,
      assetId,
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