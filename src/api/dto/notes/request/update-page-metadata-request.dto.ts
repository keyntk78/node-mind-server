import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdatePageMetadataRequestDto {
  @ApiPropertyOptional({ example: 'NestJS Notes' })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'title must not be empty' })
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ example: '🧠', nullable: true })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(50)
  icon?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.png',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  coverUrl?: string | null;
}
