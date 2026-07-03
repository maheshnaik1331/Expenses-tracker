import { Test, TestingModule } from '@nestjs/testing';
import { RecurringBillsController } from './recurring-bills.controller';
import { RecurringBillsService } from './recurring-bills.service';

describe('RecurringBillsController', () => {
  let controller: RecurringBillsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringBillsController],
      providers: [RecurringBillsService],
    }).compile();

    controller = module.get<RecurringBillsController>(RecurringBillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
