import { Module } from '@nestjs/common';
import { MigrationService } from './migration.service';
import { MigrationController } from './migration.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [MigrationController],
  providers: [MigrationService, ConfigService],
})
export class MigrationModule {}
