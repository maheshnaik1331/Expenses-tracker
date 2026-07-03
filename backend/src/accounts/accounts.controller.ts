import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('accounts')
@UseGuards(FirebaseAuthGuard) // Secures all routes in this controller
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) { }

  @Post()
  create(@Req() req, @Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(req.user.id, createAccountDto);
  }

  @Get()
  findAll(@Req() req) {
    return this.accountsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.accountsService.findOne(req.user.id, id);
  }

  // ==========================================
  // THE MISSING EDIT ENDPOINT
  // ==========================================
  @Put(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateAccountDto: Partial<CreateAccountDto>
  ) {
    return this.accountsService.update(req.user.id, id, updateAccountDto);
  }

  // ==========================================
  // THE DELETE ENDPOINT (For Purging Ledgers)
  // ==========================================
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.accountsService.remove(req.user.id, id);
  }
}