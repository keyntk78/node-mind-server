import { LoginCommand } from '@application/auth/command/login.command';
import { LogoutCommand } from '@application/auth/command/logout.command';
import { RefreshTokenCommand } from '@application/auth/command/refresh-token.command';
import { RegisterCommand } from '@application/auth/command/register.command';
import { ResendVerificationOtpCommand } from '@application/auth/command/resend-verification-otp.command';
import { VerifyEmailCommand } from '@application/auth/command/verify-email.command';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { ResponseService } from '@common/services/response.service';
import { Body, Controller, Post, Req, UseInterceptors } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { LoginRequestDto } from '../dto/auth/request/login-request.dto';
import { LogoutRequestDto } from '../dto/auth/request/logout-request.dto';
import { RefreshTokenRequestDto } from '../dto/auth/request/refresh-token-request.dto';
import { RegisterRequestDto } from '../dto/auth/request/register-request.dto';
import { ResendVerificationOtpRequestDto } from '../dto/auth/request/resend-verification-otp-request.dto';
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

  /**
   * Resend verification OTP
   * api/v1/auth/resend-verification-otp
   * @param resendOtpDto DTO containing email
   * @returns Normalized email and OTP expiration time
   */
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('resend-verification-otp')
  @ApiOperation({ summary: 'Resend verification OTP' })
  @ApiResponse({ status: 200, description: 'Verification OTP resent.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async resendVerificationOtp(
    @Body() resendOtpDto: ResendVerificationOtpRequestDto,
  ) {
    const result = await this.commandBus.execute(
      new ResendVerificationOtpCommand(resendOtpDto.email),
    );

    return this.responseService.success('Verification OTP resent', result);
  }

  /**
   * Login with email and password
   * api/v1/auth/login
   * @param loginDto DTO containing email, password, and optional device info
   * @returns Tokens, user, default workspace, and roles
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  @ApiResponse({
    status: 403,
    description: 'Account is inactive, unverified, or missing workspace.',
  })
  async login(@Body() loginDto: LoginRequestDto, @Req() request: Request) {
    const result = await this.commandBus.execute(
      new LoginCommand(
        loginDto.email,
        loginDto.password,
        loginDto.deviceInfo ?? null,
        request.ip ?? null,
      ),
    );

    return this.responseService.success('Login successfully', result);
  }

  /**
   * Refresh access token with a valid refresh token
   * api/v1/auth/refresh
   * @param refreshTokenDto DTO containing refresh token
   * @returns New access token and rotated refresh token
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  @ApiResponse({ status: 429, description: 'Refresh request in progress.' })
  async refresh(@Body() refreshTokenDto: RefreshTokenRequestDto) {
    const result = await this.commandBus.execute(
      new RefreshTokenCommand(refreshTokenDto.refreshToken),
    );

    return this.responseService.success('Token refreshed successfully', result);
  }

  /**
   * Logout the current session by invalidating its refresh token
   * api/v1/auth/logout
   * @param logoutDto DTO containing refresh token
   * @returns Logout status
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('logout')
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 200, description: 'Logout successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  async logout(@Body() logoutDto: LogoutRequestDto) {
    const result = await this.commandBus.execute(
      new LogoutCommand(logoutDto.refreshToken),
    );

    return this.responseService.success('Logout successfully', result);
  }
}
