import { ExtendedPrismaClient } from '@app/lib';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CustomPrismaService } from 'nestjs-prisma';
import { CreateInvoiceDto } from './dto';
import { User } from '@prisma/client';
import * as moment from 'moment-timezone';

@Injectable()
export class VoucherService {
  constructor(
    @Inject('PrismaService')
    private prisma: CustomPrismaService<ExtendedPrismaClient>,
  ) {}

  private escapeRegex(query: string) {
    return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async getAll(
    page: number = 1,
    rowPerPage: number = 10,
    search?: string | null,
    startDate?: string | null,
    endDate?: string | null,
  ) {
    try {
      const skip = (parseInt(page.toString()) - 1) * rowPerPage;

      const where: any = {
        status: 'ACTIVE',
      };

      if (search) {
        where.OR = [
          {
            voucherNumber: {
              contains: this.escapeRegex(search.toString()),
            },
          },
          {
            Customer: {
              name: {
                contains: this.escapeRegex(search.toString()),
              },
            },
          },
          {
            Truck: {
              name: {
                contains: this.escapeRegex(search.toString()),
              },
            },
          },
        ];
      }

      if (startDate && endDate) {
        where.date = {
          gte: moment(startDate).tz('Asia/Yangon').toISOString(),
          lte: moment(endDate).tz('Asia/Yangon').toISOString(),
        };
      }

      const [voucherList, totalCount] = await this.prisma.client.$transaction([
        this.prisma.client.voucher.findMany({
          where,
          skip,
          take: parseInt(rowPerPage.toString()),
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            CreatedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            VoucherDetail: true,
            Customer: {
              select: {
                id: true,
                name: true,
              },
            },
            Truck: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        this.prisma.client.voucher.count({
          where,
        }),
      ]);

      return {
        data: voucherList,
        currentPage: parseInt(page.toString()),
        rowPerPage,
        totalCount,
        totalPages: Math.ceil(totalCount / rowPerPage),
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: string) {
    try {
      await this.prisma.client.voucher.update({
        where: {
          id,
        },
        data: {
          status: 'DELETED',
        },
      });
    } catch (err) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getById(id: string) {
    try {
      const voucherData = await this.prisma.client.voucher.findUnique({
        where: {
          id,
        },
        include: {
          CreatedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          VoucherDetail: true,
          Customer: {
            select: {
              id: true,
              name: true,
            },
          },
          Truck: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return voucherData;
    } catch (err) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createInvoice(
    account: Omit<User, 'password'>,
    createInvoiceDto: CreateInvoiceDto,
  ) {
    const { invoice, detail } = createInvoiceDto;

    try {
      // Create Invoice record
      const createdVoucher = await this.prisma.client.voucher.create({
        data: {
          voucherNumber: invoice.invoiceId,
          Customer: {
            connectOrCreate: {
              where: {
                name: invoice.customer,
              },
              create: {
                name: invoice.customer,
              },
            },
          },
          Truck: {
            connectOrCreate: {
              where: {
                name: invoice.truck,
              },
              create: {
                name: invoice.truck,
              },
            },
          },
          date: moment(invoice.date).tz('Asia/Yangon').toISOString(),
          CreatedBy: {
            connect: {
              id: account.id,
            },
          },
        },
      });

      // Create Invoice Detail records
      const invoiceDetails = await this.prisma.client.voucherDetail.createMany({
        data: detail.map((item) => ({
          voucherId: createdVoucher.id,
          particular: item.particular,
          particularNote: item.particularNote,
          ply: item.ply,
          size: item.size,
          unitPrice: item.unitPrice,
          qty: item.qty,
          note: item.note || null,
          amount: item.unitPrice * item.qty,
        })),
      });

      return {
        message: 'Invoice created successfully',
        invoice: createdVoucher,
        details: invoiceDetails,
      };
    } catch (error) {
      console.log(error);
      throw new Error('Error creating invoice: ' + error.message);
    }
  }

  async getVouchersForCurrentWeek() {
    const startOfWeek = moment().startOf('isoWeek').toISOString();
    const endOfWeek = moment().endOf('isoWeek').toISOString();

    const vouchers = await this.prisma.client.voucher.findMany({
      where: {
        AND: [
          {
            status: 'ACTIVE',
          },
          {
            date: {
              gte: startOfWeek,
              lte: endOfWeek,
            },
          },
        ],
      },
      select: {
        id: true,
        voucherNumber: true,
        createdAt: true,
        VoucherDetail: {
          select: {
            amount: true,
          },
        },
      },
    });

    console.log(vouchers);

    const weeklyData = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };

    vouchers.forEach((voucher) => {
      const dayOfWeek = moment(voucher.createdAt).format('dddd');

      const totalAmountForVoucher = voucher.VoucherDetail.reduce(
        (acc, detail) => acc + detail.amount,
        0,
      );

      if (weeklyData[dayOfWeek] !== undefined) {
        weeklyData[dayOfWeek] += totalAmountForVoucher;
      }
    });

    const result = Object.keys(weeklyData).map((key) => ({
      key,
      value: weeklyData[key],
    }));
    console.log(result);

    return weeklyData;
  }
}
