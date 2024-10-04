import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateInvoiceDto } from './dto';
import { Request } from 'express';
import { User } from '@prisma/client';

@ApiTags('Voucher')
@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @ApiOperation({
    summary: 'Voucher list',
    description: 'fetch voucher list',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({
    name: 'rowPerPage',
    description: 'Row Per Page',
    required: false,
  })
  @ApiQuery({
    name: 'pageIndex',
    description: 'Page Index',
    required: false,
  })
  @ApiQuery({
    name: 'search',
    description: 'Search',
    required: false,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start Date',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End Date',
    required: false,
  })
  @Get('voucher-list')
  async voucherListFetcher(
    @Query()
    query: {
      rowPerPage?: number;
      pageIndex?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    try {
      const voucherInfo = await this.voucherService.getAll(
        query.pageIndex,
        query.rowPerPage,
        query.search,
        query.startDate,
        query.endDate,
      );
      return { data: voucherInfo };
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

  @ApiOperation({
    summary: 'Voucher Detail',
    description: 'fetch voucher detail by id',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('voucher-detail/:id')
  async voucherDetailFetcher(@Param('id') id: string) {
    try {
      const voucherInfo = await this.voucherService.getById(id);
      return { data: voucherInfo };
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

  @Post('voucher-create')
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiBody({ type: CreateInvoiceDto })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Req() req: Request,
  ) {
    try {
      const user = req.user as Omit<User, 'password'>;
      const voucherInfo = await this.voucherService.createInvoice(
        user,
        createInvoiceDto,
      );
      return { data: voucherInfo };
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
