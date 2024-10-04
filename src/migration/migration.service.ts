import { ExtendedPrismaClient } from '@app/lib';
import { Inject, Injectable } from '@nestjs/common';
import { CustomPrismaService } from 'nestjs-prisma';
import * as mysql from 'mysql2/promise';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { genSaltSync, hashSync } from 'bcrypt';

@Injectable()
export class MigrationService {
  constructor(
    @Inject('PrismaService')
    private prisma: CustomPrismaService<ExtendedPrismaClient>,
    private configService: ConfigService,
  ) {}

  private connection: mysql.Connection;

  async connect() {
    if (!this.connection) {
      this.connection = await mysql.createConnection({
        host: this.configService.get<string>('MYSQL_HOST'),
        user: this.configService.get<string>('MYSQL_USER'),
        password: this.configService.get<string>('MYSQL_PASSWORD'),
        database: this.configService.get<string>('MYSQL_DB'),
      });
    }
  }

  async closeConnection() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async migrateUser(user: Omit<User, 'password'>) {
    await this.connect();
    const [row] = await this.connection.execute('Select * from users');
    const mysqlUserList: {
      uid: number;
      username: string;
      password: string;
      role: number;
      status: number;
    }[] = row as any;
    if (mysqlUserList.length > 0) {
      const createdUser = await this.prisma.client.user.createMany({
        data: [
          ...mysqlUserList.map((u) => {
            return {
              name: u.username,
              email: '',
              phone: '',
              password: hashSync(u.password, genSaltSync()),
              userId: u.username,
              createdById: user.id,
            };
          }),
        ],
      });
      return createdUser;
    }
    return 'User list not found';
  }

  async migrateDocument(page: number, rowPerPage: number) {
    await this.connect();

    // Get total count of documents to migrate
    const [totalRows] = await this.connection.execute(
      `SELECT COUNT(*) as totalCount FROM documents;`,
    );
    const totalCount = totalRows[0].totalCount;

    // Calculate total number of pages
    const totalPages = Math.ceil(totalCount / rowPerPage);

    console.log(
      `Starting migration of ${totalCount} records across ${totalPages} pages...`,
    );

    // Calculate offset based on page and rowPerPage
    const offset = (page - 1) * rowPerPage;

    // Fetch documents for the current page
    const [row] = await this.connection.execute(
      `SELECT * FROM documents ORDER BY createdAt ASC LIMIT ${rowPerPage} OFFSET ${offset};`,
    );

    const mysqlVoucherList: {
      docid: number;
      voucherId: string;
      customerName: string;
      truckNo: number;
      date: string;
      createdBy: string;
    }[] = row as any;

    if (mysqlVoucherList.length > 0) {
      for (let i = 0; i < mysqlVoucherList.length; i++) {
        const voucher = mysqlVoucherList[i];

        // Get voucher details
        const [row] = await this.connection.execute(
          `SELECT * FROM document_details WHERE docid = ${voucher.docid};`,
        );
        const voucherDetails: {
          particular: string;
          particularNote: string;
          ply: string;
          size: string;
          unitPrice: number;
          qty: number;
          amount: number;
          note: string;
          status: number;
        }[] = row as any;

        if (voucherDetails.length > 0) {
          try {
            // Create voucher in MongoDB
            const createdVoucher = await this.prisma.client.voucher.create({
              data: {
                voucherNumber: voucher.voucherId,
                Customer: {
                  connectOrCreate: {
                    where: {
                      name: voucher.customerName.toString(),
                    },
                    create: {
                      name: voucher.customerName.toString(),
                    },
                  },
                },
                Truck: {
                  connectOrCreate: {
                    where: {
                      name: voucher.truckNo.toString(),
                    },
                    create: {
                      name: voucher.truckNo.toString(),
                    },
                  },
                },
                date: voucher.date,
                CreatedBy: {
                  connect: {
                    userId: voucher.createdBy !== 'System' ? 'hmk' : 'system',
                  },
                },
              },
            });

            // Log progress with pagination
            console.log(
              `Migrating voucher ${i + 1 + offset} of ${totalCount} | Voucher id = ${voucher.voucherId}`,
            );

            // Migrate voucher details
            for (let j = 0; j < voucherDetails.length; j++) {
              const voucherDetail = voucherDetails[j];
              await this.prisma.client.voucherDetail.create({
                data: {
                  voucherId: createdVoucher.id,
                  particular: voucherDetail.particular,
                  particularNote: voucherDetail.particularNote,
                  ply: voucherDetail.ply,
                  size: voucherDetail.size,
                  unitPrice: voucherDetail.unitPrice,
                  qty: voucherDetail.qty,
                  amount: voucherDetail.amount,
                  note: voucherDetail.note,
                  status: voucherDetail.status === 1 ? 'ACTIVE' : 'DELETED',
                },
              });
            }
          } catch (err) {
            console.log(`Error creating voucher ${voucher.voucherId}:`, err);
          }
        } else {
          console.log(`Detail not found for voucher ${voucher.voucherId}`);
        }
      }

      const remainingPages = totalPages - page;

      return {
        message: `${mysqlVoucherList.length} vouchers imported on page ${page}`,
        currentPage: page,
        totalPages: totalPages,
        remainingPages: remainingPages > 0 ? remainingPages : 0,
        nextPage: remainingPages > 0 ? parseInt(page.toString()) + 1 : null,
      };
    }

    return 'No more vouchers to migrate.';
  }
}
