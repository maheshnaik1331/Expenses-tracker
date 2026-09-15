import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FlowIntensity } from '@prisma/client';

@Injectable()
export class CyclesService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: { startDate: string; endDate?: string; flow?: FlowIntensity; symptoms?: string[]; notes?: string }) {
        return this.prisma.cycleLog.create({
            data: {
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
                flow: data.flow || FlowIntensity.MEDIUM,
                symptoms: data.symptoms || [],
                notes: data.notes,
                userId,
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.cycleLog.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
        });
    }

    async findOne(userId: string, id: string) {
        const log = await this.prisma.cycleLog.findFirst({
            where: { id, userId },
        });
        if (!log) throw new NotFoundException('Cycle log not found or access denied.');
        return log;
    }

    async update(userId: string, id: string, data: { startDate?: string; endDate?: string; flow?: FlowIntensity; symptoms?: string[]; notes?: string }) {
        // 1. Verify ownership before updating
        const log = await this.prisma.cycleLog.findFirst({ where: { id, userId } });
        if (!log) throw new NotFoundException('Cycle log not found or access denied.');

        // 2. Safely apply updates
        return this.prisma.cycleLog.update({
            where: { id },
            data: {
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                flow: data.flow,
                symptoms: data.symptoms,
                notes: data.notes,
            },
        });
    }

    async remove(userId: string, id: string) {
        // 1. Verify ownership before deleting
        const log = await this.prisma.cycleLog.findFirst({ where: { id, userId } });
        if (!log) throw new NotFoundException('Cycle log not found or access denied.');

        // 2. Safely delete
        return this.prisma.cycleLog.delete({ where: { id } });
    }
}