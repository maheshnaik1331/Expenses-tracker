import { IsString, IsNumber, IsOptional, IsEnum, IsISO8601 } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
    @IsEnum(TransactionType)
    type: TransactionType;

    @IsNumber()
    amount: number;

    @IsString()
    category: string;

    @IsString()
    accountId: string;

    @IsOptional()
    @IsString()
    toAccountId?: string;

    @IsOptional()
    @IsString()
    note?: string;

    // Explicitly defining the date property to accept the exact IST timestamp from the frontend
    @IsOptional()
    @IsISO8601()
    date?: string | Date;
}