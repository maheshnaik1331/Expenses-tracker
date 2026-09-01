import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';

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
                principal: data.principal,
                monthlyRate: data.monthlyRate || 0,
                startDate: new Date(data.startDate),
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                status: 'ACTIVE',
            },
        });
    }

    // UPDATED: Removed the 'status: ACTIVE' filter so the frontend receives the entire ledger
    async findAll(userId: string) {
        return this.prisma.loan.findMany({
            where: {
                userId
            },
            orderBy: { startDate: 'desc' },
        });
    }

    async update(id: string, userId: string, updateData: UpdateLoanDto) {
        const loan = await this.prisma.loan.findFirst({
            where: { id, userId },
        });

        if (!loan) throw new NotFoundException('Credit agreement not found');

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

        if (!loan) throw new NotFoundException('Credit agreement not found');

        return this.prisma.loan.delete({
            where: { id },
        });
    }

    // UPDATED: Stamps the exact date and time the instrument was cleared to freeze interest calculations
    async markAsCleared(id: string, userId: string) {
        const loan = await this.prisma.loan.findFirst({
            where: { id, userId },
        });

        if (!loan) throw new NotFoundException('Credit agreement not found');

        return this.prisma.loan.update({
            where: { id },
            data: {
                status: 'CLEARED',
                clearedDate: new Date()
            },
        });
    }
}