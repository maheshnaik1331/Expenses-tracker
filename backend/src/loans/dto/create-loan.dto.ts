import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateLoanDto {
    @IsString()
    counterparty: string;

    @IsString()
    direction: 'BORROWED' | 'LENT';

    @IsString()
    type: string;

    @IsNumber()
    principal: number;

    @IsOptional()
    @IsNumber()
    monthlyRate?: number;

    @IsDateString()
    startDate: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string; // <-- Make sure this is here!
}