import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutRequestDto {
  @ApiProperty({ example: 'eyJhbGciOi...' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
