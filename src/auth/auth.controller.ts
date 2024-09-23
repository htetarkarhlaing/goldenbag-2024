import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AllExceptionsFilter } from '@app/lib';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserLoginDTO } from './dto';
import { Request } from 'express';
import { User } from '@prisma/client';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
@UseFilters(AllExceptionsFilter)
export class AuthController {
  constructor(private authService: AuthService) {}

  // ? --------------------------------------------------Account Routes ----------------------------------------------------
  @ApiOperation({
    summary: 'User login',
    description:
      'Login Code & phone number can be use as email when you try to login',
  })
  @ApiBody({
    type: UserLoginDTO,
  })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async loginUser(@Req() req: Request) {
    try {
      const user = req.user as Omit<User, 'password'>;

      const userCredentials = await this.authService.loginService(user);
      return {
        data: userCredentials,
        message: 'login successful',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'User info',
    description: 'fetch user ingo',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('whoami')
  async userDataFetcher(@Req() req: Request) {
    try {
      const user = req.user as Omit<User, 'password'>;
      const userInfo = await this.authService.userInfoProvider(user);
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
