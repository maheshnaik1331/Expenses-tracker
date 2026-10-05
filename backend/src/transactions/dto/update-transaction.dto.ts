import { IsString, IsNumber, IsOptional, IsEnum, IsISO8601 } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class UpdateTransactionDto {
    @IsOptional()
    @IsEnum(TransactionType)
    type?: TransactionType;

    @IsOptional()
    @IsNumber()
    amount?: number;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    accountId?: string;

    @IsOptional()
    @IsString()
    toAccountId?: string;

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsISO8601()
    date?: string | Date;
}