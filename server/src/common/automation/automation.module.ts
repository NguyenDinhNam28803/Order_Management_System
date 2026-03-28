import { Module, Global } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { RfqmoduleModule } from '../../rfqmodule/rfqmodule.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [RfqmoduleModule, PrismaModule],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
