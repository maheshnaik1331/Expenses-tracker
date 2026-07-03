import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) { }

  // Create a transaction AND update the account balance simultaneously securely
  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const { amount, type, accountId } = createTransactionDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Fetch the account to check its balance AND verify ownership
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId: userId }, // SECURITY: Must belong to this user
      });

      if (!account) {
        throw new BadRequestException('Account not found or access denied.');
      }

      // 2. Calculate the new balance
      let newBalance = account.currentBalance;
      if (type === 'INCOME') {
        newBalance += amount;
      } else if (type === 'EXPENSE') {
        newBalance -= amount;
      } else {
        throw new BadRequestException('Invalid transaction type. Must be INCOME or EXPENSE');
      }

      // 3. Update the account balance
      await prisma.account.update({
        where: { id: accountId }, // Safe to update because we verified ownership above
        data: { currentBalance: newBalance },
      });

      // 4. Create the actual transaction record
      return prisma.transaction.create({
        data: {
          ...createTransactionDto,
          userId: userId, // CRITICAL: Tie the transaction row to the tenant
        },
      });
    });
  }

  // Fetch all transactions belonging exclusively to the user
  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId: userId },
      include: { account: true },
      orderBy: { date: 'desc' }, // Newest first
    });
  }

  // Fetch a single transaction securely
  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: id, userId: userId },
      include: { account: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found or access denied.');
    }

    return transaction;
  }

  // Delete a transaction AND mathematically reverse the account balance
  async remove(userId: string, id: string) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Find the transaction and verify the user owns it
      const transaction = await prisma.transaction.findFirst({
        where: { id: id, userId: userId },
        include: { account: true },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found or access denied.');
      }

      // 2. Calculate the reversed balance
      let reversedBalance = transaction.account.currentBalance;
      if (transaction.type === 'INCOME') {
        reversedBalance -= transaction.amount; // Undo income
      } else if (transaction.type === 'EXPENSE') {
        reversedBalance += transaction.amount; // Undo expense
      }

      // 3. Update the linked account to the corrected balance
      await prisma.account.update({
        where: { id: transaction.accountId },
        data: { currentBalance: reversedBalance },
      });

      // 4. Permanently delete the transaction record
      return prisma.transaction.delete({
        where: { id: id },
      });
    });
  }
}