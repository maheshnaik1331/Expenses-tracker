import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CyclesService } from './cycles.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { FlowIntensity } from '@prisma/client';

@Controller('cycles')
@UseGuards(FirebaseAuthGuard) // Secures all endpoints under /cycles
export class CyclesController {
    constructor(private readonly cyclesService: CyclesService) { }

    @Post()
    create(@Req() req, @Body() body: { startDate: string; endDate?: string; flow?: FlowIntensity; symptoms?: string[]; notes?: string }) {
        return this.cyclesService.create(req.user.id, body);
    }

    @Get()
    findAll(@Req() req) {
        return this.cyclesService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Req() req, @Param('id') id: string) {
        return this.cyclesService.findOne(req.user.id, id);
    }

    @Patch(':id')
    update(@Req() req, @Param('id') id: string, @Body() body: any) {
        return this.cyclesService.update(req.user.id, id, body);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id') id: string) {
        return this.cyclesService.remove(req.user.id, id);
    }
}