import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvestorService } from './investor.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';
import { DeactivateInvestorDto } from './dto/deactivate-investor.dto';

@Controller('investors')
export class InvestorController {
  constructor(private readonly investorService: InvestorService) {}

  @Post()
  create(@Body(ValidationPipe) createInvestorDto: CreateInvestorDto) {
    return this.investorService.create(createInvestorDto);
  }

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.investorService.findAll(include);
  }

  @Get('active')
  findActiveInvestors() {
    return this.investorService.findActiveInvestors();
  }

  @Get('inactive')
  findInactiveInvestors() {
    return this.investorService.findInactiveInvestors();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.investorService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateInvestorDto: UpdateInvestorDto,
  ) {
    return this.investorService.update(id, updateInvestorDto);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Param('id') id: string,
    @Body(ValidationPipe) deactivateInvestorDto: DeactivateInvestorDto,
  ) {
    return this.investorService.deactivate(id, deactivateInvestorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.investorService.remove(id);
  }
}
