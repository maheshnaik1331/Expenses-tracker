import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { PayLoanDto } from './dto/pay-loan.dto';
import { TransactionType, PaymentType, LoanDirection } from '@prisma/client';

@Injectable()
export class LoansService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: CreateLoanDto) {
        return this.prisma.loan.create({
            data: {
                userId,
                counterparty: data.counterparty,
                direction: data.direction,
                type: data.type,
                interestType: data.interestType || 'SIMPLE',
                principal: data.principal,
                monthlyRate: data.monthlyRate || 0,
                startDate: new Date(data.startDate),
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                status: 'ACTIVE',
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.loan.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
            include: {
                transactions: {
                    orderBy: { date: 'asc' } // Ensure chronological order for math engine
                }
            }
        });
    }

    async update(id: string, userId: string, updateData: UpdateLoanDto) {
        const loan = await this.prisma.loan.findFirst({
            where: { id, userId },
        });

        if (!loan) throw new NotFoundException('Credit agreement not found.');

        const dataToUpdate: any = { ...updateData };

        if (updateData.startDate) {
            dataToUpdate.startDate = new Date(updateData.startDate);
        }

        if (updateData.dueDate !== undefined) {
            dataToUpdate.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
        }

        return this.prisma.loan.update({
            where: { id },
            data: dataToUpdate,
        });
    }

    async remove(id: string, userId: string) {
        const loan = await this.prisma.loan.findFirst({
            where: { id, userId },
        });

        if (!loan) throw new NotFoundException('Credit agreement not found.');

        return this.prisma.loan.delete({
            where: { id },
        });
    }

    async markAsCleared(id: string, userId: string) {
        const loan = await this.prisma.loan.findFirst({
            where: { id, userId },
        });

        if (!loan) throw new NotFoundException('Credit agreement not found.');

        return this.prisma.loan.update({
            where: { id },
            data: {
                status: 'CLEARED',
                clearedDate: new Date()
            },
        });
    }

    // --- Advanced Multi-Payment Engine ---
    async processPartialPayment(
        id: string,
        userId: string,
        payData: PayLoanDto
    ) {
        const loan = await this.prisma.loan.findFirst({
            where: { id, userId },
            include: {
                transactions: {
                    orderBy: { date: 'desc' }
                }
            }
        });

        if (!loan) throw new NotFoundException('Credit instrument not found.');
        if (loan.status === 'CLEARED') throw new BadRequestException('This instrument is already settled.');

        const isLiability = loan.direction === LoanDirection.BORROWED;
        const txType = isLiability ? TransactionType.EXPENSE : TransactionType.INCOME;
        const transactionDate = payData.date ? new Date(payData.date) : new Date();

        const prismaOperations: any[] = [];
        let totalImpactAmount = 0;

        // 1. Process Principal Reduction
        if (payData.principalAmount > 0) {
            totalImpactAmount += payData.principalAmount;
            prismaOperations.push(
                this.prisma.transaction.create({
                    data: {
                        userId,
                        accountId: payData.accountId,
                        type: txType,
                        paymentType: PaymentType.PRINCIPAL,
                        amount: payData.principalAmount,
                        category: loan.type,
                        note: `Principal Settlement: ${loan.counterparty}`,
                        loanId: loan.id,
                        date: transactionDate,
                    }
                })
            );
        }

        // 2. Process Interest Collection/Payment
        if (payData.interestAmount > 0) {
            totalImpactAmount += payData.interestAmount;
            prismaOperations.push(
                this.prisma.transaction.create({
                    data: {
                        userId,
                        accountId: payData.accountId,
                        type: txType,
                        paymentType: PaymentType.INTEREST,
                        amount: payData.interestAmount,
                        category: 'Interest',
                        note: `Interest Settlement: ${loan.counterparty}`,
                        loanId: loan.id,
                        date: transactionDate,
                    }
                })
            );
        }

        if (prismaOperations.length === 0) {
            throw new BadRequestException('Total payment amount must be greater than zero.');
        }

        // 3. Adjust the funding/receiving Account Balance
        prismaOperations.push(
            this.prisma.account.update({
                where: { id: payData.accountId },
                data: {
                    currentBalance: isLiability
                        ? { decrement: totalImpactAmount }
                        : { increment: totalImpactAmount }
                }
            })
        );

        // 4. Update the Loan Principal & Status
        const newPrincipal = Math.max(0, loan.principal - payData.principalAmount);
        const isNowCleared = newPrincipal === 0;

        prismaOperations.push(
            this.prisma.loan.update({
                where: { id },
                data: {
                    principal: newPrincipal,
                    status: isNowCleared ? 'CLEARED' : 'ACTIVE',
                    clearedDate: isNowCleared ? transactionDate : loan.clearedDate,
                }
            })
        );

        return this.prisma.$transaction(prismaOperations);
    }
}