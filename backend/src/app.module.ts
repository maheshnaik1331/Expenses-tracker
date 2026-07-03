import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoansModule } from './loans/loans.module';
import { AuthModule } from './auth/auth.module';
import { RecurringBillsModule } from './recurring-bills/recurring-bills.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    // AccountsModule,
    // TransactionsModule,
    // LoansModule,
    // RecurringBillsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }