import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoansService {
    constructor(private prisma: PrismaService) { }

    // Save credit/liability explicitly mapped to the authenticated tenant
    async createLoan(
        userId: string,
        data: {
            counterparty: string;
            direction: 'BORROWED' | 'LENT';
            type: 'HOME' | 'GOLD' | 'PERSONAL' | 'BUSINESS';
            principal: number;
            monthlyRate?: number;
            startDate: string;
        }
    ) {
        return this.prisma.debt.create({
            data: {
                counterparty: data.counterparty,
                direction: data.direction,
                type: data.type,
                principal: data.principal,
                monthlyRate: data.monthlyRate || 0, // Fallback to 0% interest if omitted
                startDate: new Date(data.startDate),
                status: 'ACTIVE',
                userId: userId, // CRITICAL: Ties this financial instrument to the specific user
            },
        });
    }

    // Fetch all active financial instruments (both borrowed and lent)
    async getActiveLoans(userId: string) {
        return this.prisma.debt.findMany({
            where: {
                userId: userId,
                status: 'ACTIVE'
            },
            orderBy: { startDate: 'desc' },
        });
    }

    // Securely transition loan state to CLOSED for audit purposes
    async markAsCleared(userId: string, id: string) {
        // Verify record presence and ownership first to avoid unauthorized state manipulation
        const loan = await this.prisma.debt.findFirst({
            where: { id, userId },
        });

        if (!loan) {
            throw new NotFoundException('Loan record not found or access denied.');
        }

        return this.prisma.debt.update({
            where: { id },
            data: {
                status: 'CLOSED',
                clearedDate: new Date() // Audit trail for when it was paid off
            },
        });
    }
}