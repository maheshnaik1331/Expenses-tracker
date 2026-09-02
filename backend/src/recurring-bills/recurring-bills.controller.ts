import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { RecurringBillsService } from './recurring-bills.service';
import { CreateRecurringBillDto } from './dto/create-recurring-bill.dto';
import { UpdateRecurringBillDto } from './dto/update-recurring-bill.dto';
import { PayRecurringBillDto } from './dto/pay-recurring-bill.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('recurring-bills')
@UseGuards(FirebaseAuthGuard)
export class RecurringBillsController {
  constructor(private readonly recurringBillsService: RecurringBillsService) { }

  @Post()
  create(@Req() req, @Body() data: CreateRecurringBillDto) {
    return this.recurringBillsService.create(req.user.id, data);
  }

  @Get()
  findAll(@Req() req) {
    return this.recurringBillsService.findAllActive(req.user.id);
  }

  // --- Support for Frontend Editing ---
  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() data: UpdateRecurringBillDto) {
    return this.recurringBillsService.update(req.user.id, id, data);
  }

  // --- Support for Frontend Deletion ---
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.recurringBillsService.remove(req.user.id, id);
  }

  // --- UPDATED: Dynamic Settlement Route ---
  @Patch(':id/pay')
  markAsPaid(@Req() req, @Param('id') id: string, @Body() payData: PayRecurringBillDto) {
    return this.recurringBillsService.markAsPaid(req.user.id, id, payData);
  }
}