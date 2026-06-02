import { RegisterCommand } from '@application/auth/command/register.command';
import { VerifyEmailCommand } from '@application/auth/command/verify-email.command';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { ResponseService } from '@common/services/response.service';
import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RegisterRequestDto } from '../dto/auth/request/register-request.dto';
import { VerifyEmailRequestDto } from '../dto/auth/request/verify-email-request.dto';

@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
// @UseGuards(ThrottlerGuard)
@UseInterceptors(LoggingInterceptor)
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly responseService: ResponseService,
  ) {}

  /**
   * Register a new user
   * api/v1/auth/register
   * @param registerDto DTO containing email, password, and full name
   * @returns Object with registrationId if registration is successful
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async register(@Body() registerDto: RegisterRequestDto) {
    const result = await this.commandBus.execute(
      new RegisterCommand(
        registerDto.email,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
      ),
    );

    return this.responseService.created(
      result,
      'User registration initiated successfully',
    );
  }

  /**
   * Verify email with OTP
   * api/v1/auth/verify-email
   * @param verifyEmailDto DTO containing email and OTP
   * @returns Tokens, verified user, and default workspace when implemented
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({ status: 200, description: 'Email successfully verified.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 410, description: 'OTP is invalid or expired.' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailRequestDto) {
    const result = await this.commandBus.execute(
      new VerifyEmailCommand(verifyEmailDto.email, verifyEmailDto.otp),
    );

    return this.responseService.success('Email verified successfully', result);
  }
}
