import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('transactions')
@UseGuards(FirebaseAuthGuard) // Secure all transaction endpoints
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Post()
  create(@Req() req, @Body() createTransactionDto: CreateTransactionDto) {
    // Pass the authenticated user's ID
    return this.transactionsService.create(req.user.id, createTransactionDto);
  }

  @Get()
  findAll(@Req() req) {
    // Fetch only this user's transaction history
    return this.transactionsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    // Validate ownership before fetching
    return this.transactionsService.findOne(req.user.id, id);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    // Safely delete and reverse the balance
    return this.transactionsService.remove(req.user.id, id);
  }
}