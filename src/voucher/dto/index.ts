import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class InvoiceDetailDto {
  @ApiProperty({
    example: 1,
    description: 'The unique ID of the invoice detail item',
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    example: 'Product A',
    description: 'The particular product or service',
  })
  @IsString()
  @IsNotEmpty()
  particular: string;

  @ApiProperty({
    example: 'Additional note for the product',
    description: 'Notes about the particular item',
  })
  @IsString()
  @IsNotEmpty()
  particularNote: string;

  @ApiProperty({ example: '5 ply', description: 'The number of layers (ply)' })
  @IsString()
  @IsNotEmpty()
  ply: string;

  @ApiProperty({
    example: '10x20',
    description: 'Size or dimensions of the item',
  })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({ example: 100, description: 'Unit price of the item' })
  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;

  @ApiProperty({ example: 1000, description: 'Quantity of the item' })
  @IsNumber()
  @IsNotEmpty()
  qty: number;

  @ApiProperty({
    example: 'Urgent delivery',
    description: 'Additional note about the item',
    required: false,
  })
  @IsString()
  note: string;
}

export class InvoiceDto {
  @ApiProperty({ example: 'INV-123213', description: 'The invoice ID' })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ example: 'Mr. John', description: 'The customer name' })
  @IsString()
  @IsNotEmpty()
  customer: string;

  @ApiProperty({
    example: '9J/12121',
    description: 'Truck number for delivery',
  })
  @IsString()
  @IsNotEmpty()
  truck: string;

  @ApiProperty({
    example: '2023-12-13T17:00:00.000Z',
    description: 'Date of the invoice in ISO format',
  })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  date: Date;
}

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Invoice details including customer and truck information',
  })
  @ValidateNested()
  @Type(() => InvoiceDto)
  invoice: InvoiceDto;

  @ApiProperty({
    description:
      'Details of the invoice including particulars, prices, and quantities',
    type: [InvoiceDetailDto],
  })
  @Type(() => InvoiceDetailDto)
  detail: InvoiceDetailDto[];
}
