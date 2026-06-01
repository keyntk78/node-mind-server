import { IsStrongPassword } from '@common/validators';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @IsStrongPassword()
  password!: string;

  @ApiProperty({ example: 'Nguyen Van' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;
}
