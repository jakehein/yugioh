import { Module } from '@nestjs/common';
import { BoosterPackController } from './booster-pack.controller';
import { BoosterPackService } from './booster-pack.service';
import { UserModule } from '../user/user.module';
import { ContentModule } from '../content/content.module';
import { UuidModule } from '../uuid/uuid.module';
import { CardModule } from '../card/card.module';

@Module({
  imports: [UserModule, UuidModule, ContentModule, CardModule],
  controllers: [BoosterPackController],
  providers: [BoosterPackService],
  exports: [BoosterPackService],
})
export class BoosterPackModule {}
