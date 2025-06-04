import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from 'nestjs-prisma';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserAgentMiddleware } from '@app/lib/middlewares/useragent.middleware';
import { MigrationModule } from './migration/migration.module';
import { VoucherModule } from './voucher/voucher.module';
import { SupplyModule } from './supply/supply.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, PrismaModule, MigrationModule, VoucherModule, SupplyModule, DashboardModule],
  controllers: [AppController],
  providers: [AppService, ConfigService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAgentMiddleware).forRoutes('*');
  }
}
