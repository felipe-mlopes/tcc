import {
  Body,
  Controller,
  Post,
  Param,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Public } from "@/infra/auth/public";
import { RecordBuyTransactionService } from "@/domain/transaction/services/record-buy-transaction";
import { TransactionType } from "@/domain/transaction/entities/transaction";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import z from "zod";

const recordBuyTransactionBodySchema = z.object({
    assetName: z.string().min(3),
    quantity: z.number().positive(),
    price: z.number().positive(),
    fees: z.number().positive().optional(),
    dateAt: z.date(),
});

type RecordBuyTransactionBody = z.infer<typeof recordBuyTransactionBodySchema>;

@Controller("/investor/:investorId/transactions/buy")
@Public()
export class RecordBuyTransactionController {
  constructor(
    private recordBuyTransactionService: RecordBuyTransactionService,
  ) {}

  @Post()
  async handle(
    @Param("investorId") investorId: string,
    @Body()body: RecordBuyTransactionBody
  ): Promise<void> {
    const { assetName, quantity, price, fees, dateAt } = body;

    const result = await this.recordBuyTransactionService.execute({
      investorId,
      assetName,
      transactionType: TransactionType.Buy,
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
