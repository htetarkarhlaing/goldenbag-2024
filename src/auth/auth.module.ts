import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { extendedPrismaClient } from '@app/lib/prisma.extension';
import { CustomPrismaModule } from 'nestjs-prisma';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '@app/lib/telegram.server.bot';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    CustomPrismaModule.forRootAsync({
      name: 'PrismaService',
      isGlobal: true,
      useFactory: () => {
        return extendedPrismaClient;
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    ConfigService,
    TelegramService,
    LocalStrategy,
    JwtStrategy,
  ],
})
export class AuthModule {}
