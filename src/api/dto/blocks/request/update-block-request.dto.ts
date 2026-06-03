import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateBlockRequestDto {
  @ApiProperty({ example: { text: 'Hello Node Mind Updated' } })
  @IsObject()
  content!: Record<string, unknown>;
}
