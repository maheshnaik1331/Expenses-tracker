import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountType } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, data: CreateAccountDto) {
    const isLiquid = data.type === AccountType.CASH || data.type === AccountType.BANK;

    return this.prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        currentBalance: data.currentBalance || 0,
        accountNumber: data.accountNumber || null,
        ifscCode: data.ifscCode || null,
        branch: data.branch || null,
        isLiquid,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAccountSummary(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    const totalBalance = accounts.reduce((acc, curr) => acc + curr.currentBalance, 0);
    const liquidCash = accounts
      .filter((a) => a.isLiquid || a.type === AccountType.CASH)
      .reduce((acc, curr) => acc + curr.currentBalance, 0);

    return {
      totalAccounts: accounts.length,
      totalBalance,
      liquidCash,
      accounts,
    };
  }

  async findOne(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async update(userId: string, accountId: string, data: Partial<CreateAccountDto>) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) throw new NotFoundException('Account not found');

    // Safely determine isLiquid status without breaking partial updates
    const isLiquid = data.type
      ? (data.type === AccountType.CASH || data.type === AccountType.BANK)
      : account.isLiquid;

    return this.prisma.account.update({
      where: { id: accountId },
      data: {
        name: data.name,
        type: data.type,
        currentBalance: data.currentBalance,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        branch: data.branch,
        isLiquid,
      },
    });
  }

  async remove(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) throw new NotFoundException('Account not found');

    return this.prisma.account.delete({ where: { id: accountId } });
  }
}