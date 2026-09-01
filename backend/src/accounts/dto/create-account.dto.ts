import { IsString, IsNumber, IsOptional, IsEnum, IsPositive } from 'class-validator';
import { AccountType } from '@prisma/client'; // <-- Import the Prisma Enum

export class CreateAccountDto {
    @IsString()
    name: string;

    // Enforce the Enum instead of a generic string
    @IsEnum(AccountType)
    type: AccountType;

    @IsNumber()
    currentBalance: number;

    @IsOptional()
    @IsString()
    accountNumber?: string;

    @IsOptional()
    @IsString()
    ifscCode?: string;

    @IsOptional()
    @IsString()
    branch?: string;
}