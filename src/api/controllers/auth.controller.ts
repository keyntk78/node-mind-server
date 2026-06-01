import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { ResponseService } from '@common/services/response.service';
import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RegisterRequestDto } from '../dto/auth/request/register-request.dto';

@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
// @UseGuards(ThrottlerGuard)
@UseInterceptors(LoggingInterceptor)
export class AuthController {
  constructor(
    // private readonly commandBus: CommandBus,
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
    // Map DTO to Command with primitives (API layer responsibility)
    // const result = await this.commandBus.execute(
    //   new RegisterCommand(
    //     registerDto.email,
    //     registerDto.password,
    //     registerDto.fullName,
    //   ),
    // );
    const result = {
      email: registerDto.email,
      fullName: registerDto.fullName,
    };

    return this.responseService.created(
      result,
      'User registration initiated successfully',
    );
  }
}
