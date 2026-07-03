import { IsOptional, IsNumber, IsString } from 'class-validator';

export class PayRecurringBillDto {
    @IsOptional()
    @IsNumber()
    amount?: number;

    @IsOptional()
    @IsString()
    accountId?: string;
}