import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, data: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        currentBalance: data.currentBalance,

        // NEW: Map the incoming data to the database columns
        accountNumber: data.accountNumber || null,
        ifscCode: data.ifscCode || null,
        branch: data.branch || null,

        userId: userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.account.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
  // Securely fetch a single account by ID
  async findOne(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId: userId // CRITICAL: Ensures users can only see their own accounts
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found or access denied.');
    }

    return account;
  }
  // Ensure updates also save the new fields
  async update(userId: string, accountId: string, data: Partial<CreateAccountDto>) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId: userId },
    });

    if (!account) throw new NotFoundException('Account not found');

    return this.prisma.account.update({
      where: { id: accountId },
      data: {
        name: data.name,
        type: data.type,
        currentBalance: data.currentBalance,

        // NEW: Allow editing of the bank details
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        branch: data.branch,
      },
    });
  }

  async remove(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId: userId },
    });

    if (!account) throw new NotFoundException('Account not found');

    return this.prisma.account.delete({
      where: { id: accountId },
    });
  }
}