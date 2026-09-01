import { IsString, IsNumber, IsPositive, IsOptional, IsDateString } from 'class-validator';

// Change this class name to exactly 'CreateTransferDto'
export class CreateTransferDto {
    @IsString()
    fromAccountId: string;

    @IsString()
    toAccountId: string;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsDateString()
    date?: string;
}