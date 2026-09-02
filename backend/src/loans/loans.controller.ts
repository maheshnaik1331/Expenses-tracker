import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { PayLoanDto } from './dto/pay-loan.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('loans')
@UseGuards(FirebaseAuthGuard)
export class LoansController {
    constructor(private readonly loansService: LoansService) { }

    @Post()
    create(@Req() req, @Body() createLoanDto: CreateLoanDto) {
        return this.loansService.create(req.user.id, createLoanDto);
    }

    // Fetches all loans (Active and Cleared) for local frontend filtering
    @Get()
    findAll(@Req() req) {
        return this.loansService.findAll(req.user.id);
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

    // --- NEW: Multi-Payment Route (Principal + Interest Split) ---
    @Patch(':id/pay')
    processPayment(
        @Req() req,
        @Param('id') id: string,
        @Body() body: PayLoanDto
    ) {
        return this.loansService.processPartialPayment(id, req.user.id, body);
    }
}