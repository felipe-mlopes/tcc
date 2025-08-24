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
import { UpdateInvestorService } from "@/domain/investor/services/update-investor";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { NotAllowedError } from "@/core/errors/not-allowed-error";

const updateInvestorBodySchema = z.object({
  name: z.string().min(3).optional(),
  email: z.email().optional(),
});

type UpdateInvestorBody = z.infer<typeof updateInvestorBodySchema>;

@Controller("/investor")
@Public()
export class UpdateInvestorController {
  constructor(private updateInvestorService: UpdateInvestorService) {}

  @Patch(":id")
  async handle(
    @Param("id") investorId: string,
    @Body() body: UpdateInvestorBody
  ): Promise<void> {
    const { name, email } = body;

    const result = await this.updateInvestorService.execute({
      investorId,
      name,
      email,
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
