import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto'; // <-- Import the DTO here
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('loans')
@UseGuards(FirebaseAuthGuard)
export class LoansController {
    constructor(private readonly loansService: LoansService) { }

    @Post()
    async createLoan(
        @Req() req,
        @Body() body: CreateLoanDto // <-- Use the clean DTO class here
    ) {
        return this.loansService.createLoan(req.user.id, body);
    }

    @Get()
    async getLoans(@Req() req) {
        return this.loansService.getActiveLoans(req.user.id);
    }

    @Patch(':id/clear')
    async clearLoan(@Req() req, @Param('id') id: string) {
        return this.loansService.markAsCleared(req.user.id, id);
    }
}