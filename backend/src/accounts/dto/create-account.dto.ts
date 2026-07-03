import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateAccountDto {
    @IsString()
    name: string;

    @IsString()
    type: string;

    @IsNumber()
    currentBalance: number;

    // NEW: Allow the API to accept these fields securely
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