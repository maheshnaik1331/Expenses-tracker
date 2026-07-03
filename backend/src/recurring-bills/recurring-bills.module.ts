import { Module } from '@nestjs/common';
import { RecurringBillsService } from './recurring-bills.service';
import { RecurringBillsController } from './recurring-bills.controller';
import { PrismaService } from '../prisma/prisma.service'; // <-- Import

@Module({
  controllers: [RecurringBillsController],
  providers: [RecurringBillsService, PrismaService], // <-- Add PrismaService here
})
export class RecurringBillsModule { }