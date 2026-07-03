import { PartialType } from '@nestjs/mapped-types';
import { CreateRecurringBillDto } from './create-recurring-bill.dto';

export class UpdateRecurringBillDto extends PartialType(CreateRecurringBillDto) {}
