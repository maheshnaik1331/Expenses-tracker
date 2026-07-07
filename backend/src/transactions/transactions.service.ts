import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) { }

  // Create a transaction AND update the account balance simultaneously securely
  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const { amount, type, accountId } = createTransactionDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Fetch the account to check its balance AND verify ownership
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId: userId },
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
        where: { id: accountId },
        data: { currentBalance: newBalance },
      });

      // 4. Create the actual transaction record
      return prisma.transaction.create({
        data: {
          ...createTransactionDto,
          userId: userId,
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

  // NEW: Update a transaction and safely recalculate account balances
  async update(userId: string, id: string, updateData: UpdateTransactionDto) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Fetch original transaction to know what math to reverse
      const originalTx = await prisma.transaction.findFirst({
        where: { id, userId },
        include: { account: true },
      });

      if (!originalTx) {
        throw new NotFoundException('Transaction not found or access denied.');
      }

      // 2. REVERSE the original transaction's impact on its account
      let reversedBalance = originalTx.account.currentBalance;
      if (originalTx.type === 'INCOME') reversedBalance -= originalTx.amount;
      if (originalTx.type === 'EXPENSE') reversedBalance += originalTx.amount;

      await prisma.account.update({
        where: { id: originalTx.accountId },
        data: { currentBalance: reversedBalance },
      });

      // 3. CALCULATE the new impact
      const newAccountId = updateData.accountId || originalTx.accountId;
      const newAmount = updateData.amount !== undefined ? updateData.amount : originalTx.amount;
      const newType = updateData.type || originalTx.type;

      // Fetch the target account (could be the same account we just reversed, or a new one)
      const targetAccount = await prisma.account.findFirst({
        where: { id: newAccountId, userId },
      });

      if (!targetAccount) {
        throw new BadRequestException('Target account not found.');
      }

      let newBalance = targetAccount.currentBalance;
      if (newType === 'INCOME') newBalance += newAmount;
      if (newType === 'EXPENSE') newBalance -= newAmount;

      // Apply new balance
      await prisma.account.update({
        where: { id: newAccountId },
        data: { currentBalance: newBalance },
      });

      // 4. Update the transaction row itself
      return prisma.transaction.update({
        where: { id },
        data: updateData,
      });
    });
  }

  // Delete a transaction AND mathematically reverse the account balance
  async remove(userId: string, id: string) {
    return this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.findFirst({
        where: { id: id, userId: userId },
        include: { account: true },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found or access denied.');
      }

      let reversedBalance = transaction.account.currentBalance;
      if (transaction.type === 'INCOME') {
        reversedBalance -= transaction.amount;
      } else if (transaction.type === 'EXPENSE') {
        reversedBalance += transaction.amount;
      }

      await prisma.account.update({
        where: { id: transaction.accountId },
        data: { currentBalance: reversedBalance },
      });

      return prisma.transaction.delete({
        where: { id: id },
      });
    });
  }
}