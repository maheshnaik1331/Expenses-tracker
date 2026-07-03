import { Test, TestingModule } from '@nestjs/testing';
import { RecurringBillsService } from './recurring-bills.service';

describe('RecurringBillsService', () => {
  let service: RecurringBillsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringBillsService],
    }).compile();

    service = module.get<RecurringBillsService>(RecurringBillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
