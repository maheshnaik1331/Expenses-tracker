import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { TaskPriority, TaskStatus } from '@prisma/client';

@Controller('tasks')
@UseGuards(FirebaseAuthGuard) // Secures all endpoints under /tasks
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    create(@Req() req, @Body() body: { title: string; description?: string; priority?: TaskPriority; dueDate?: string }) {
        return this.tasksService.create(req.user.id, body);
    }

    @Get()
    findAll(@Req() req) {
        return this.tasksService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Req() req, @Param('id') id: string) {
        return this.tasksService.findOne(req.user.id, id);
    }

    @Patch(':id')
    update(@Req() req, @Param('id') id: string, @Body() body: any) {
        return this.tasksService.update(req.user.id, id, body);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id') id: string) {
        return this.tasksService.remove(req.user.id, id);
    }
}