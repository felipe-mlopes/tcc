import {
  Controller,
  Param,
  Patch,
  NotFoundException,
} from "@nestjs/common";

import { Public } from "@/infra/auth/public";
import { DeactivateInvestorService } from "@/domain/investor/services/deactivate-investor";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

@Controller("/investor")
@Public()
export class DeactivateInvestorController {
  constructor(private desactiveInvestorService: DeactivateInvestorService) {}

  @Patch(":id/desactive")
  async handle(@Param("id") investorId: string): Promise<{ message: string }> {
    const result = await this.desactiveInvestorService.execute({
      investorId,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message);
        default:
          throw new NotFoundException("Unexpected error.");
      }
    }

    return result.value;
  }
}
