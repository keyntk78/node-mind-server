import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyEmailRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '123456', minLength: 6, maxLength: 6 })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, {
    message: 'otp must be a 6-digit numeric code',
  })
  otp!: string;
}
