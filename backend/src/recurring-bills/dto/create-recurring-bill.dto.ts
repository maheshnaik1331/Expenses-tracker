import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { RecurrenceInterval } from '@prisma/client';

export class CreateRecurringBillDto {
    @IsString()
    name: string;

    @IsNumber()
    amount: number;

    @IsString()
    category: string;

    @IsEnum(RecurrenceInterval)
    interval: RecurrenceInterval;

    @IsOptional()
    @IsNumber()
    customDays?: number;

    @IsDateString()
    nextDueDate: string;

    @IsString()
    accountId: string;
}