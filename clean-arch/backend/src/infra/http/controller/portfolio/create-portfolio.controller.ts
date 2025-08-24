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
import { CreatePortfolioService } from "@/domain/portfolio/services/create-portfolio";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";

const createPortfolioBodySchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
});

type CreatePortfolioBody = z.infer<typeof createPortfolioBodySchema>;

@Controller("/:investorId/portfolio")
@Public()
export class CreatePortfolioController {
  constructor(private createPortfolioService: CreatePortfolioService) {}

  @Post()
  async handle(
    @Param("investorId") investorId: string,
    @Body() body: CreatePortfolioBody
  ): Promise<void> {
    const { name, description } = body;

    const result = await this.createPortfolioService.execute({
      investorId,
      name,
      description,
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
