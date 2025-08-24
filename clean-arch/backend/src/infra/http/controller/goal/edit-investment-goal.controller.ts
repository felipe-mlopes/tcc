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
import { EditInvestmentGoalService } from "@/domain/goal/services/edit-investment-goal";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { Priority, Status } from "@/domain/goal/entities/goal";

const editInvestmentGoalBodySchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  targetDate: z.coerce.date().optional(),
  priority: z.enum(Priority).optional(),
  status: z.enum(Status).optional(),
});

type EditInvestmentGoalBody = z.infer<typeof editInvestmentGoalBodySchema>;

@Controller("/investor/:investorId/goals")
@Public()
export class EditInvestmentGoalController {
  constructor(private editInvestmentGoalService: EditInvestmentGoalService) {}

  @Patch(":goalId")
  async handle(
    @Param("investorId") investorId: string,
    @Param("goalId") goalId: string,
    @Body() body: EditInvestmentGoalBody
  ) {
    const { name, description, targetAmount, targetDate, priority, status } = body;

    const result = await this.editInvestmentGoalService.execute({
      investorId,
      goalId,
      name,
      description,
      targetAmount,
      targetDate,
      priority,
      status,
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