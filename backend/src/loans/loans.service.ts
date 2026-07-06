import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';

@Injectable()
export class LoansService {
    constructor(private prisma: PrismaService) { }

    // 1. Create a new credit instrument
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
                // Handle optional dueDate
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                status: 'ACTIVE',
            },
        });
    }

    // 2. Fetch all active instruments for the user dashboard
    async findAllActive(userId: string) {
        return this.prisma.loan.findMany({
            where: {
                userId,
                status: 'ACTIVE'
            },
            orderBy: { startDate: 'desc' },
        });
    }

    // 3. Edit/Update an existing instrument
    async update(id: string, userId: string, updateData: UpdateLoanDto) {
        // Security Check: Ensure the loan exists AND belongs to the requesting user
        const loan = await this.prisma.loan.findFirst({
            where: { id, userId },
        });

        if (!loan) throw new NotFoundException('Credit agreement not found');

        // Safely format dates for Prisma if they are included in the update payload
        const dataToUpdate: any = { ...updateData };

        if (updateData.startDate) {
            dataToUpdate.startDate = new Date(updateData.startDate);
        }

        // Explicitly check for undefined to allow passing 'null' to clear the date
        if (updateData.dueDate !== undefined) {
            dataToUpdate.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
        }

        return this.prisma.loan.update({
            where: { id },
            data: dataToUpdate,
        });
    }

    // 4. Delete an instrument permanently
    async remove(id: string, userId: string) {
        const loan = await this.prisma.loan.findFirst({
            where: { id, userId },
        });

        if (!loan) throw new NotFoundException('Credit agreement not found');

        return this.prisma.loan.delete({
            where: { id },
        });
    }

    // 5. Mark an instrument as Settled/Cleared
    async markAsCleared(id: string, userId: string) {
        const loan = await this.prisma.loan.findFirst({
            where: { id, userId },
        });

        if (!loan) throw new NotFoundException('Credit agreement not found');

        return this.prisma.loan.update({
            where: { id },
            data: { status: 'CLEARED' },
        });
    }
}