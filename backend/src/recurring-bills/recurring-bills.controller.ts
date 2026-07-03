import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { RecurringBillsService } from './recurring-bills.service';
import { CreateRecurringBillDto } from './dto/create-recurring-bill.dto';
import { PayRecurringBillDto } from './dto/pay-recurring-bill.dto'; // <-- IMPORT THIS
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

  // Update this route to accept the Body!
  @Patch(':id/pay')
  markAsPaid(@Req() req, @Param('id') id: string, @Body() payData: PayRecurringBillDto) {
    return this.recurringBillsService.markAsPaid(req.user.id, id, payData);
  }
}