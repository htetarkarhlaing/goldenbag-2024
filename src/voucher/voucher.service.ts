import { ExtendedPrismaClient } from '@app/lib';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CustomPrismaService } from 'nestjs-prisma';
import { CreateInvoiceDto } from './dto';
import { User } from '@prisma/client';

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
          gte: new Date(startDate),
          lte: new Date(endDate),
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
          date: invoice.date,
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
}
