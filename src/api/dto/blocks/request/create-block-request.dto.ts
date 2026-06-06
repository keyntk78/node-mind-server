import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';

export const SUPPORTED_BLOCK_TYPES = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bullet_list',
  'numbered_list',
  'todo',
  'quote',
  'code',
  'image',
  'divider',
] as const;

export class CreateBlockRequestDto {
  @ApiProperty({ example: 'paragraph', enum: SUPPORTED_BLOCK_TYPES })
  @IsIn(SUPPORTED_BLOCK_TYPES)
  type!: string;

  @ApiProperty({ example: { text: 'Hello Node Mind' } })
  @IsObject()
  content!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
