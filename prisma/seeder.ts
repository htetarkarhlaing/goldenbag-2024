import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { genSaltSync, hashSync } from 'bcrypt';
import { CustomPrismaService } from 'nestjs-prisma';
import { LoginCodeGenerator } from '../libs/lib/src/LoginCodeGenerator';
import { extendedPrismaClient } from '../libs/lib/src/prisma.extension';

const prismaClient = new PrismaClient();
const customPrismaService = new CustomPrismaService(extendedPrismaClient);
const loginCodeGenerator = new LoginCodeGenerator(customPrismaService);

const masterPhone = process.env.MASTER_PHONE as string;
const masterEmail = process.env.MASTER_EMAIL as string;
const masterPassword = process.env.MASTER_PASSWORD as string;

async function main() {
  console.log(`Start seeding ... 🌱`);

  try {
    const masterAccount: Prisma.UserCreateInput = {
      name: 'Master Account',
      email: masterEmail,
      phone: masterPhone,
      password: hashSync(masterPassword, genSaltSync()),
      userId: await loginCodeGenerator.generate(),
    };

    // * creating seeder master account
    await prismaClient.user.create({
      data: masterAccount,
    });

    console.log(`Seeding finished ... 🌲`);
  } catch (err) {
    console.log(`Seeding failed ... ⚠️`);
    console.error(err);
  } finally {
    await prismaClient.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
