import {
  Body,
  Controller,
  Post,
  Param,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Public } from "@/infra/auth/public";
import { TransactionType } from "@/domain/transaction/entities/transaction";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { RecordDividendTransactionService } from "@/domain/transaction/services/record-dividend-transaction";

@Controller("/investor/:investorId/transactions/buy")
@Public()
export class RecordDividendTransactionController {
  constructor(
    private recordDividendTransactionService: RecordDividendTransactionService,
  ) {}

  @Post()
  async handle(
    @Param("investorId") investorId: string,
    @Body()
    body: {
      assetName: string;
      price: number;
      income: number;
      dateAt: string;
    },
  ): Promise<void> {
    const { assetName, price, income, dateAt } = body;

    const result = await this.recordDividendTransactionService.execute({
      investorId,
      assetName,
      transactionType: TransactionType.Dividend,
      price,
      income,
      dateAt: new Date(dateAt),
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
