import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskPriority, TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: { title: string; description?: string; priority?: TaskPriority; dueDate?: string }) {
        return this.prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                priority: data.priority || TaskPriority.MEDIUM,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                userId,
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.task.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(userId: string, id: string) {
        const task = await this.prisma.task.findFirst({
            where: { id, userId },
        });
        if (!task) throw new NotFoundException('Task not found or access denied.');
        return task;
    }

    async update(userId: string, id: string, data: { title?: string; description?: string; priority?: TaskPriority; status?: TaskStatus; dueDate?: string }) {
        // 1. Verify ownership before updating
        const task = await this.prisma.task.findFirst({ where: { id, userId } });
        if (!task) throw new NotFoundException('Task not found or access denied.');

        // 2. Safely apply updates
        return this.prisma.task.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                priority: data.priority,
                status: data.status,
                completedAt: data.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED ? new Date() : undefined,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            },
        });
    }

    async remove(userId: string, id: string) {
        // 1. Verify ownership before deleting
        const task = await this.prisma.task.findFirst({ where: { id, userId } });
        if (!task) throw new NotFoundException('Task not found or access denied.');

        // 2. Safely delete
        return this.prisma.task.delete({ where: { id } });
    }
}