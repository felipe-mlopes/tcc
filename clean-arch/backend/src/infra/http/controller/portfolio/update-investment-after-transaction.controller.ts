import {
  Controller,
  Param,
  Patch,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Public } from "@/infra/auth/public";
import { UpdateInvestmentAfterTransactionService } from "@/domain/portfolio/services/update-investment-after-transaction";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { NotAllowedError } from "@/core/errors/not-allowed-error";

@Controller("/investor/:investorId/portfolio/investment/:transactionId/update")
@Public()
export class UpdateInvestmentAfterTransactionController {
  constructor(private updateInvestmentAfterTransactionService: UpdateInvestmentAfterTransactionService) {}

  @Patch()
  async handle(
    @Param("investorId") investorId: string,
    @Param("transactionId") transactionId: string
  ): Promise<void> {
    const result = await this.updateInvestmentAfterTransactionService.execute({
      investorId,
      transactionId,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        case NotAllowedError:
          throw new ForbiddenException(error.message);
        default:
          throw new ForbiddenException("Unexpected error.");
      }
    }
  }
}
