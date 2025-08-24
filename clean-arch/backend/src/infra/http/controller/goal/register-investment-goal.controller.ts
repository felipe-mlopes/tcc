import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { z } from "zod";

import { Public } from "@/infra/auth/public";
import { RegisterInvestmentGoalService } from "@/domain/goal/services/register-investment-goal";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Priority } from "@/domain/goal/entities/goal";

const registerInvestmentGoalBodySchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  targetAmount: z.number().positive(),
  targetDate: z.coerce.date(),
  priority: z.enum(Priority),
});

type RegisterInvestmentGoalBody = z.infer<typeof registerInvestmentGoalBodySchema>;

@Controller("/investor/:investorId/goals")
@Public()
export class RegisterInvestmentGoalController {
  constructor(private registerInvestmentGoalService: RegisterInvestmentGoalService) {}

  @Post()
  async handle(
    @Param("investorId") investorId: string,
    @Body() body: RegisterInvestmentGoalBody
  ) {
    const { name, description, targetAmount, targetDate, priority } = body;

    const result = await this.registerInvestmentGoalService.execute({
      investorId,
      name,
      description,
      targetAmount,
      targetDate,
      priority,
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