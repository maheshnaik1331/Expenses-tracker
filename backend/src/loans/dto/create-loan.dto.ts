import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { DebtType, LoanDirection } from '@prisma/client';

export class CreateLoanDto {
    @IsString()
    counterparty: string;

    @IsEnum(LoanDirection, { message: 'Direction must be either BORROWED or LENT' })
    direction: LoanDirection;

    @IsEnum(DebtType)
    type: DebtType;

    @IsNumber()
    principal: number;

    @IsOptional()
    @IsNumber()
    monthlyRate?: number;

    @IsDateString()
    startDate: string;
}