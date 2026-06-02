import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePageRequestDto {
  @ApiProperty({ example: '018fd1e8-3c74-7f41-9fb2-78a7790d1b2a' })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Parent page id. Null creates a root page.',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ example: 'Backend Notes', default: 'Untitled' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ example: '🧠', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string | null;
}
