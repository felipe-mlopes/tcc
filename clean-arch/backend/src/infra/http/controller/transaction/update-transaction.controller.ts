import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
} from "@nestjs/common";
import { z } from "zod";

import { Public } from "@/infra/auth/public";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { TransactionType } from "@/domain/transaction/entities/transaction";
import { UpdateTransactionService } from "@/domain/transaction/services/update-transaction";

const updateTransactionBodySchema = z.object({
  transactionType: z.enum(TransactionType).optional(),
  quantity: z.number().positive().optional(),
  price: z.number().positive().optional(),
  fees: z.number().min(0).optional(),
});

type UpdateTransactionBody = z.infer<typeof updateTransactionBodySchema>;

@Controller("/investor/:investorId/transaction")
@Public()
export class UpdateTransactionController {
  constructor(private updateTransactionService: UpdateTransactionService) {}

  @Patch(":transactionId")
  async handle(
    @Param("investorId") investorId: string,
    @Param("transactionId") transactionId: string,
    @Body() body: UpdateTransactionBody
  ): Promise<void> {
    const { transactionType, quantity, price, fees } = body;

    const result = await this.updateTransactionService.execute({
      investorId,
      transactionId,
      transactionType,
      quantity,
      price,
      fees,
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
  }
}