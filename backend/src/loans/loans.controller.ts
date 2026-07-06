import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('loans')
@UseGuards(FirebaseAuthGuard) // Secures all routes in this controller
export class LoansController {
    constructor(private readonly loansService: LoansService) { }

    @Post()
    create(@Req() req, @Body() createLoanDto: CreateLoanDto) {
        return this.loansService.create(req.user.id, createLoanDto);
    }

    @Get()
    findAllActive(@Req() req) {
        return this.loansService.findAllActive(req.user.id);
    }

    @Patch(':id')
    update(@Req() req, @Param('id') id: string, @Body() updateLoanDto: UpdateLoanDto) {
        return this.loansService.update(id, req.user.id, updateLoanDto);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id') id: string) {
        return this.loansService.remove(id, req.user.id);
    }

    @Patch(':id/clear')
    markAsCleared(@Req() req, @Param('id') id: string) {
        return this.loansService.markAsCleared(id, req.user.id);
    }
}