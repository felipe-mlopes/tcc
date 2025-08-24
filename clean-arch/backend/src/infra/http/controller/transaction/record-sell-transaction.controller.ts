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
import { RecordSellTransactionService } from "@/domain/transaction/services/record-sell-transaction";
import z from "zod";

const recordSellTransactionBodySchema = z.object({
    assetName: z.string().min(3),
    quantity: z.number().positive(),
    price: z.number(),
    fees: z.number().positive().optional(),
    dateAt: z.date(),
});

type RecordSellTransactionBody = z.infer<typeof recordSellTransactionBodySchema>;

@Controller("/investor/:investorId/transactions/buy")
@Public()
export class RecordSellTransactionController {
  constructor(
    private recordSellTransactionService: RecordSellTransactionService,
  ) {}

  @Post()
  async handle(
    @Param("investorId") investorId: string,
    @Body() body: RecordSellTransactionBody
  ): Promise<void> {
    const { assetName, quantity, price, fees, dateAt } = body;

    const result = await this.recordSellTransactionService.execute({
      investorId,
      assetName,
      transactionType: TransactionType.Sell,
      quantity,
      price,
      fees,
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
