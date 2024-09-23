import { ExtendedPrismaClient } from '@app/lib/prisma.extension';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { compareSync } from 'bcrypt';
import { unset } from 'lodash';
import { CustomPrismaService } from 'nestjs-prisma';

@Injectable()
export class AuthService {
  constructor(
    @Inject('PrismaService')
    private prisma: CustomPrismaService<ExtendedPrismaClient>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ? --------------------------------------- Helper functions --------------------------------------------------
  private async generateTokens(id: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id,
        },
        {
          secret: this.configService.get('JWT_ACCESS_TOKEN'),
          expiresIn: '1d',
        },
      ),
      this.jwtService.signAsync(
        {
          id: id,
        },
        {
          secret: this.configService.get('JWT_REFRESH_TOKEN'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async findOne(email: string) {
    return this.prisma.client.user.findFirst({
      where: {
        OR: [
          {
            email,
          },
          {
            userId: email,
          },
          {
            phone: email,
          },
        ],
      },
    });
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<null | Omit<User, 'password'>> {
    const user = await this.findOne(email);
    if (user && compareSync(password, user.password)) {
      const result = user;
      unset(user, 'password');
      return result;
    }
    return null;
  }

  async validateByUserId(
    userId: string,
  ): Promise<null | Omit<User, 'password'>> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    const tokenValid = true;
    if (tokenValid) {
      const result = user;
      unset(result, 'password');
      return result;
    }
    return null;
  }

  async loginService(
    account: Omit<User, 'password'>,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const generatedTokens = await this.generateTokens(account.id);
      if (generatedTokens) {
        return generatedTokens;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async userInfoProvider(
    user: Omit<User, 'password'>,
  ): Promise<null | Omit<User, 'password'>> {
    try {
      const userInfo = await this.prisma.client.user.findUnique({
        where: {
          id: user.id,
        },
      });
      return userInfo;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
