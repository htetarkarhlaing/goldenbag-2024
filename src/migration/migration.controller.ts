import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MigrationService } from './migration.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { User } from '@prisma/client';

@ApiTags('Migration')
@Controller('migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @ApiOperation({
    summary: 'User migration',
    description: 'fetch user from mysql and import it to mongoDB',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('user-data')
  async userDataMigrator(@Req() req: Request) {
    try {
      const user = req.user as Omit<User, 'password'>;
      const userInfo = await this.migrationService.migrateUser(user);
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

  @ApiOperation({
    summary: 'Document migration',
    description: 'fetch document from mysql and import it to mongoDB',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('doc-data')
  @ApiQuery({ name: 'rowPerPage', description: 'Row Per Page' })
  @ApiQuery({
    name: 'pageIndex',
    description: 'Page Index',
  })
  async docDataMigrator(
    @Query()
    query: {
      rowPerPage: number;
      pageIndex: number;
    },
  ) {
    try {
      const userInfo = await this.migrationService.migrateDocument(
        query.pageIndex,
        query.rowPerPage,
      );
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
