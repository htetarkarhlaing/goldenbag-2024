import { Inject, Injectable } from '@nestjs/common';
import { CustomPrismaService } from 'nestjs-prisma';
import { ExtendedPrismaClient } from './prisma.extension';

@Injectable()
export class LoginCodeGenerator {
  constructor(
    @Inject('PrismaService')
    private prisma: CustomPrismaService<ExtendedPrismaClient>,
  ) {}

  async generate(): Promise<string> {
    const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    let result = '';

    // Generate 5 random alphabets
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * alphabets.length);
      result += alphabets[randomIndex];
    }

    // Generate 3 random numbers
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * numbers.length);
      result += numbers[randomIndex];
    }

    const existingLoginCode = await this.prisma.client.user.findFirst({
      where: {
        userId: result,
      },
    });

    if (existingLoginCode) {
      return this.generate(); // ? Recursive function call
    } else {
      return result;
    }
  }
}
