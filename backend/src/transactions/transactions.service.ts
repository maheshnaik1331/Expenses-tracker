import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateTransferDto } from '../transfer/dto/create-transfer.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) { }

  // ==========================================
  // 🌟 SAFE TIME PARSER
  // Trusts the frontend's explicitly defined timezone string
  // ==========================================
  private enforceIST(dateInput?: any): Date {
    if (!dateInput) {
      return new Date();
    }

    let dateStr = dateInput instanceof Date ? dateInput.toISOString() : String(dateInput);

    // If the frontend sent the explicit +05:30 timezone offset, we parse it directly.
    if (dateStr.includes('+') || dateStr.match(/-\d{2}:\d{2}$/)) {
      return new Date(dateStr);
    }

    // If the frontend sends a naked date (e.g. YYYY-MM-DD), force it to be midnight IST
    if (dateStr.length === 10) {
      return new Date(`${dateStr}T00:00:00.000+05:30`);
    }

    // Fallback parser for standard payload formats
    return new Date(dateStr);
  }

  // ==========================================
  // 1. CREATE STANDARD TRANSACTION
  // ==========================================
  async create(userId: string, createDto: CreateTransactionDto) {
    const { amount, type, accountId, toAccountId } = createDto;

    // Securely parse the explicit frontend date
    const finalDate = this.enforceIST(createDto.date);

    return this.prisma.$transaction(async (prisma) => {
      // Fetch source account
      const sourceAccount = await prisma.account.findFirst({
        where: { id: accountId, userId },
      });

      if (!sourceAccount) {
        throw new BadRequestException('Source account not found or access denied.');
      }

      if (type === TransactionType.INCOME) {
        await prisma.account.update({
          where: { id: accountId },
          data: { currentBalance: { increment: amount } },
        });
      } else if (type === TransactionType.EXPENSE) {
        if (sourceAccount.currentBalance < amount) {
          throw new BadRequestException('Insufficient balance in source account.');
        }
        await prisma.account.update({
          where: { id: accountId },
          data: { currentBalance: { decrement: amount } },
        });
      } else if (type === TransactionType.TRANSFER) {
        if (!toAccountId) {
          throw new BadRequestException('Destination account (toAccountId) is required for transfers.');
        }
        if (accountId === toAccountId) {
          throw new BadRequestException('Source and destination accounts must be different.');
        }

        const targetAccount = await prisma.account.findFirst({
          where: { id: toAccountId, userId },
        });

        if (!targetAccount) {
          throw new BadRequestException('Target destination account not found or access denied.');
        }

        if (sourceAccount.currentBalance < amount) {
          throw new BadRequestException('Insufficient balance for transfer.');
        }

        // Deduct from source, add to target
        await prisma.account.update({
          where: { id: accountId },
          data: { currentBalance: { decrement: amount } },
        });

        await prisma.account.update({
          where: { id: toAccountId },
          data: { currentBalance: { increment: amount } },
        });
      }

      return prisma.transaction.create({
        data: {
          ...createDto,
          date: finalDate, // Inject the mathematically perfect date
          userId,
        },
      });
    });
  }

  // ==========================================
  // 2. DEDICATED SELF-TRANSFER EXECUTION
  // ==========================================
  async executeSelfTransfer(userId: string, transferDto: CreateTransferDto) {
    const { fromAccountId, toAccountId, amount, note, date } = transferDto;

    if (fromAccountId === toAccountId) {
      throw new BadRequestException('Source and destination accounts must be different.');
    }

    const finalDate = this.enforceIST(date);

    return this.prisma.$transaction(async (prisma) => {
      const source = await prisma.account.findFirst({ where: { id: fromAccountId, userId } });
      const target = await prisma.account.findFirst({ where: { id: toAccountId, userId } });

      if (!source || !target) {
        throw new NotFoundException('One or both accounts were not found.');
      }

      if (source.currentBalance < amount) {
        throw new BadRequestException(`Insufficient funds in ${source.name}. Balance: ${source.currentBalance}`);
      }

      // Perform updates
      await prisma.account.update({
        where: { id: fromAccountId },
        data: { currentBalance: { decrement: amount } },
      });

      await prisma.account.update({
        where: { id: toAccountId },
        data: { currentBalance: { increment: amount } },
      });

      return prisma.transaction.create({
        data: {
          type: TransactionType.TRANSFER,
          amount,
          category: 'Self Transfer',
          note: note || `Transfer from ${source.name} to ${target.name}`,
          accountId: fromAccountId,
          toAccountId: toAccountId,
          userId,
          date: finalDate,
        },
        include: {
          account: true,
          toAccount: true,
        },
      });
    });
  }

  // ==========================================
  // 3. FETCH ALL
  // ==========================================
  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        account: true,
        toAccount: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  // ==========================================
  // 4. FETCH ONE
  // ==========================================
  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: id, userId: userId },
      include: {
        account: true,
        toAccount: true
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found or access denied.');
    }

    return transaction;
  }

  // ==========================================
  // 5. UPDATE TRANSACTION safely
  // ==========================================
  async update(userId: string, id: string, updateData: UpdateTransactionDto) {
    const updatePayload = { ...updateData };
    if (updatePayload.date) {
      updatePayload.date = this.enforceIST(updatePayload.date);
    }

    return this.prisma.$transaction(async (prisma) => {
      const originalTx = await prisma.transaction.findFirst({
        where: { id, userId },
        include: { account: true, toAccount: true },
      });

      if (!originalTx) {
        throw new NotFoundException('Transaction not found or access denied.');
      }

      // --- STEP A: Reverse the original transaction's impact ---
      if (originalTx.type === TransactionType.INCOME) {
        await prisma.account.update({
          where: { id: originalTx.accountId },
          data: { currentBalance: { decrement: originalTx.amount } },
        });
      } else if (originalTx.type === TransactionType.EXPENSE) {
        await prisma.account.update({
          where: { id: originalTx.accountId },
          data: { currentBalance: { increment: originalTx.amount } },
        });
      } else if (originalTx.type === TransactionType.TRANSFER && originalTx.toAccountId) {
        // Reverse transfer: Add back to source, deduct from destination
        await prisma.account.update({
          where: { id: originalTx.accountId },
          data: { currentBalance: { increment: originalTx.amount } },
        });
        await prisma.account.update({
          where: { id: originalTx.toAccountId },
          data: { currentBalance: { decrement: originalTx.amount } },
        });
      }

      // --- STEP B: Apply the new transaction impact ---
      const newAccountId = updatePayload.accountId || originalTx.accountId;
      const newToAccountId = updatePayload.toAccountId || originalTx.toAccountId;
      const newAmount = updatePayload.amount !== undefined ? updatePayload.amount : originalTx.amount;
      const newType = updatePayload.type || originalTx.type;

      if (newType === TransactionType.INCOME) {
        await prisma.account.update({
          where: { id: newAccountId },
          data: { currentBalance: { increment: newAmount } },
        });
      } else if (newType === TransactionType.EXPENSE) {
        await prisma.account.update({
          where: { id: newAccountId },
          data: { currentBalance: { decrement: newAmount } },
        });
      } else if (newType === TransactionType.TRANSFER && newToAccountId) {
        await prisma.account.update({
          where: { id: newAccountId },
          data: { currentBalance: { decrement: newAmount } },
        });
        await prisma.account.update({
          where: { id: newToAccountId },
          data: { currentBalance: { increment: newAmount } },
        });
      }

      // --- STEP C: Update the record ---
      return prisma.transaction.update({
        where: { id },
        data: updatePayload,
      });
    });
  }

  // ==========================================
  // 6. DELETE TRANSACTION securely
  // ==========================================
  async remove(userId: string, id: string) {
    return this.prisma.$transaction(async (prisma) => {
      const tx = await prisma.transaction.findFirst({
        where: { id, userId },
      });

      if (!tx) throw new NotFoundException('Transaction not found');

      // Reverse balance based on type
      if (tx.type === TransactionType.INCOME) {
        await prisma.account.update({
          where: { id: tx.accountId },
          data: { currentBalance: { decrement: tx.amount } },
        });
      } else if (tx.type === TransactionType.EXPENSE) {
        await prisma.account.update({
          where: { id: tx.accountId },
          data: { currentBalance: { increment: tx.amount } },
        });
      } else if (tx.type === TransactionType.TRANSFER && tx.toAccountId) {
        await prisma.account.update({
          where: { id: tx.accountId },
          data: { currentBalance: { increment: tx.amount } },
        });
        await prisma.account.update({
          where: { id: tx.toAccountId },
          data: { currentBalance: { decrement: tx.amount } },
        });
      }

      return prisma.transaction.delete({ where: { id } });
    });
  }
}