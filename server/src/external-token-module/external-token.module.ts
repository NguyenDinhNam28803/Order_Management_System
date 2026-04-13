import { Module } from '@nestjs/common';
import { ExternalTokenService } from './external-token.service';
import { ExternalTokenController } from './external-token.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExternalTokenController],
  providers: [ExternalTokenService],
  exports: [ExternalTokenService],
})
export class ExternalTokenModule {}
