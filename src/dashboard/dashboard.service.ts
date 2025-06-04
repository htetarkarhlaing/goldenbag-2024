import { ExtendedPrismaClient } from '@app/lib';
import { Inject, Injectable } from '@nestjs/common';
import { CustomPrismaService } from 'nestjs-prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(
    @Inject('PrismaService')
    private prisma: CustomPrismaService<ExtendedPrismaClient>,
  ) {}
  async getDashboardData() {
    const now = new Date();

    // Monthly revenue (last 5 months)
    const monthlyRevenue = await Promise.all(
      Array.from({ length: 5 }).map(async (_, index) => {
        const date = subMonths(now, 4 - index);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        const voucherDetails = await this.prisma.client.voucherDetail.findMany({
          where: {
            Voucher: {
              date: {
                gte: start,
                lte: end,
              },
            },
          },
        });
        const revenue = voucherDetails.reduce((sum, v) => sum + v.amount, 0);
        return { month: format(date, 'MMM'), revenue };
      }),
    );

    // Voucher count by user
    const voucherCountByUserRaw = await this.prisma.client.voucher.groupBy({
      by: ['createdById'],
      _count: { _all: true },
      where: { createdById: { not: null } },
    });
    const users = await this.prisma.client.user.findMany({
      where: { id: { in: voucherCountByUserRaw.map((v) => v.createdById!) } },
    });
    const voucherCountByUser = voucherCountByUserRaw.map((v) => {
      const user = users.find((u) => u.id === v.createdById);
      return { user: user?.name || 'Unknown', count: v._count._all };
    });

    // Top customers by revenue
    const vouchers = await this.prisma.client.voucher.findMany({
      include: { Customer: true, VoucherDetail: true },
    });
    const customerRevenue: Record<string, number> = {};
    vouchers.forEach((voucher) => {
      const revenue = voucher.VoucherDetail.reduce(
        (sum, d) => sum + d.amount,
        0,
      );
      if (voucher.Customer) {
        customerRevenue[voucher.Customer.name] =
          (customerRevenue[voucher.Customer.name] || 0) + revenue;
      }
    });
    const topCustomers = Object.entries(customerRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    // Top trucks by usage
    const truckCounts = vouchers.reduce(
      (acc, voucher) => {
        acc[voucher.truckId] = (acc[voucher.truckId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const truckIds = Object.keys(truckCounts);
    const trucks = await this.prisma.client.truck.findMany({
      where: { id: { in: truckIds } },
    });
    const topTrucks = trucks
      .map((truck) => ({ truck: truck.name, count: truckCounts[truck.id] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Average order value by month
    const averageOrderValue = await Promise.all(
      Array.from({ length: 4 }).map(async (_, index) => {
        const date = subMonths(now, 3 - index);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        const monthlyVouchers = await this.prisma.client.voucher.findMany({
          where: { date: { gte: start, lte: end } },
          include: { VoucherDetail: true },
        });
        const totalAmount = monthlyVouchers.reduce(
          (sum, v) => sum + v.VoucherDetail.reduce((s, d) => s + d.amount, 0),
          0,
        );
        const avg =
          monthlyVouchers.length > 0 ? totalAmount / monthlyVouchers.length : 0;
        return { month: format(date, 'MMM'), avg };
      }),
    );

    // Top items by quantity sold
    const allDetails = await this.prisma.client.voucherDetail.findMany();
    const itemCounts: Record<string, number> = {};
    allDetails.forEach((d) => {
      const key = d.ply || d.particular || 'Unknown';
      itemCounts[key] = (itemCounts[key] || 0) + d.qty;
    });
    const topItems = Object.entries(itemCounts)
      .map(([item, qty]) => ({ item, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);

    return {
      monthlyRevenue,
      voucherCountByUser,
      topCustomers,
      topTrucks,
      averageOrderValue,
      topItems,
    };
  }
}
