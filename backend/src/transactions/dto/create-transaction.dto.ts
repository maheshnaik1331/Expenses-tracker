export class CreateTransactionDto {
    type: string; // 'INCOME' or 'EXPENSE'
    amount: number;
    category: string;
    accountId: string; // Which account this money belongs to
    note?: string;
}