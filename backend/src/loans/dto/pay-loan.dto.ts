import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class PayLoanDto {
    @IsString()
    accountId: string;

    @IsNumber()
    principalAmount: number;

    @IsNumber()
    interestAmount: number;

    @IsOptional()
    @IsDateString()
    date?: string;
}
