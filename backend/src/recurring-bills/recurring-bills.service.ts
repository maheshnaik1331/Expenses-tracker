import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringBillDto } from './dto/create-recurring-bill.dto';
import { UpdateRecurringBillDto } from './dto/update-recurring-bill.dto';
import { PayRecurringBillDto } from './dto/pay-recurring-bill.dto';
import { PaymentType } from '@prisma/client';

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
      include: {
        account: { select: { id: true, name: true } },
        transactions: { orderBy: { date: 'desc' } } // <-- Include History
      }
    });
  }

  async markAsPaid(userId: string, billId: string, payData?: PayRecurringBillDto & { date?: string }) {
    const bill = await this.prisma.recurringBill.findFirst({
      where: { id: billId, userId },
    });

    if (!bill) throw new NotFoundException('Subscription contract not found.');

    const nextDate = new Date(bill.nextDueDate);
    switch (bill.interval) {
      case 'WEEKLY': nextDate.setDate(nextDate.getDate() + 7); break;
      case 'BIWEEKLY': nextDate.setDate(nextDate.getDate() + 14); break;
      case 'MONTHLY': nextDate.setMonth(nextDate.getMonth() + 1); break;
      case 'QUARTERLY': nextDate.setMonth(nextDate.getMonth() + 3); break;
      case 'YEARLY': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      case 'CUSTOM':
        if (!bill.customDays) throw new BadRequestException('Custom days parameter missing.');
        nextDate.setDate(nextDate.getDate() + bill.customDays);
        break;
    }

    const finalAmount = payData?.amount ?? bill.amount;
    const finalAccountId = payData?.accountId ?? bill.accountId;

    // Use the explicit date from the user, or fallback to today
    const transactionDate = payData?.date ? new Date(payData.date) : new Date();

    return this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          type: 'EXPENSE',
          paymentType: PaymentType.STANDARD,
          amount: finalAmount,
          category: bill.category,
          note: `Automated Settlement: ${bill.name}`,
          accountId: finalAccountId,
          userId: userId,
          recurringBillId: bill.id,
          date: transactionDate // <-- Inject Custom Date
        }
      }),
      this.prisma.account.update({
        where: { id: finalAccountId },
        data: { currentBalance: { decrement: finalAmount } }
      }),
      this.prisma.recurringBill.update({
        where: { id: bill.id },
        data: {
          lastPaidDate: transactionDate, // <-- Stamp with Custom Date
          nextDueDate: nextDate
        }
      })
    ]);
  }

  async update(userId: string, id: string, data: UpdateRecurringBillDto) {
    const bill = await this.prisma.recurringBill.findFirst({
      where: { id, userId },
    });

    if (!bill) throw new NotFoundException('Subscription contract not found.');

    const dataToUpdate: any = { ...data };
    if (data.nextDueDate) {
      dataToUpdate.nextDueDate = new Date(data.nextDueDate);
    }

    return this.prisma.recurringBill.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(userId: string, id: string) {
    const bill = await this.prisma.recurringBill.findFirst({
      where: { id, userId },
    });

    if (!bill) throw new NotFoundException('Subscription contract not found.');

    return this.prisma.recurringBill.delete({
      where: { id },
    });
  }
}