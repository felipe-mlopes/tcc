import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UpdateGoalProgressDto } from './dto/update-goal-progress.dto';
import { GoalService } from './goal.service';

@Controller('goal')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createGoalDto: CreateGoalDto) {
    return this.goalService.create(createGoalDto);
  }

  @Get()
  findAll(@Query('investorId') investorId?: string) {
    return this.goalService.findAll(investorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.goalService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGoalDto: UpdateGoalDto) {
    return this.goalService.update(id, updateGoalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.goalService.remove(id);
  }

  @Patch(':id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateGoalProgressDto,
  ) {
    return this.goalService.updateProgress(id, updateProgressDto);
  }

  @Patch(':id/achieve')
  @HttpCode(HttpStatus.OK)
  markAsAchieved(@Param('id') id: string) {
    return this.goalService.markAsAchieved(id);
  }

  @Post(':id/projection')
  calculateProjection(
    @Param('id') id: string,
    @Body() body: { monthlyContribution: number },
  ) {
    return this.goalService.calculateGoalProjection(
      id,
      body.monthlyContribution,
    );
  }
}
