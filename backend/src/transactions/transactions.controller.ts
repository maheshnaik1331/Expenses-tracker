import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto'; // <-- Added import
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('transactions')
@UseGuards(FirebaseAuthGuard) // Secure all transaction endpoints
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Post()
  create(@Req() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.id, createTransactionDto);
  }

  @Get()
  findAll(@Req() req) {
    return this.transactionsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.transactionsService.findOne(req.user.id, id);
  }

  // NEW: The missing update route!
  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(req.user.id, id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.transactionsService.remove(req.user.id, id);
  }
}