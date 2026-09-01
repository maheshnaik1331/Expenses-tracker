import { IsString, IsNumber, IsOptional, IsEnum, IsPositive } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
    @IsEnum(TransactionType)
    type: TransactionType;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsString()
    category: string;

    @IsOptional()
    @IsString()
    note?: string;

    @IsString()
    accountId: string;

    // NEW: Required for Transfers
    @IsOptional()
    @IsString()
    toAccountId?: string;
}