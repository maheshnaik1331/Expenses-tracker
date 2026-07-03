import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringBillDto } from './dto/create-recurring-bill.dto';
import { PayRecurringBillDto } from './dto/pay-recurring-bill.dto';

@Injectable()
export class RecurringBillsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, data: CreateRecurringBillDto) {
    return this.prisma.recurringBill.create({
      data: {
        ...data,
        nextDueDate: new Date(data.nextDueDate),
        userId,
      },
    });
  }

  async findAllActive(userId: string) {
    return this.prisma.recurringBill.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { nextDueDate: 'asc' },
      // FIX 1: Make sure we select the 'id' of the account too!
      include: { account: { select: { id: true, name: true } } }
    });
  }

  // FIX 2: Accept the payData and override the default bill values if provided
  async markAsPaid(userId: string, billId: string, payData?: PayRecurringBillDto) {
    const bill = await this.prisma.recurringBill.findFirst({
      where: { id: billId, userId },
    });

    if (!bill) throw new NotFoundException('Bill not found');

    const nextDate = new Date(bill.nextDueDate);
    switch (bill.interval) {
      case 'WEEKLY': nextDate.setDate(nextDate.getDate() + 7); break;
      case 'BIWEEKLY': nextDate.setDate(nextDate.getDate() + 14); break;
      case 'MONTHLY': nextDate.setMonth(nextDate.getMonth() + 1); break;
      case 'QUARTERLY': nextDate.setMonth(nextDate.getMonth() + 3); break;
      case 'YEARLY': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      case 'CUSTOM':
        if (!bill.customDays) throw new BadRequestException('Custom days missing');
        nextDate.setDate(nextDate.getDate() + bill.customDays);
        break;
    }

    // Determine final amounts and accounts (use the override, or fallback to the template)
    const finalAmount = payData?.amount ?? bill.amount;
    const finalAccountId = payData?.accountId ?? bill.accountId;

    return this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          type: 'EXPENSE',
          amount: finalAmount, // Use dynamic amount
          category: bill.category,
          note: `Auto-Paid: ${bill.name}`,
          accountId: finalAccountId, // Use dynamic account
          userId: userId,
          date: new Date()
        }
      }),
      this.prisma.account.update({
        where: { id: finalAccountId }, // Use dynamic account
        data: { currentBalance: { decrement: finalAmount } }
      }),
      this.prisma.recurringBill.update({
        where: { id: bill.id },
        data: { lastPaidDate: new Date(), nextDueDate: nextDate }
      })
    ]);
  }
}