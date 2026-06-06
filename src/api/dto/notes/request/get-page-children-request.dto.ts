import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

const UUID_PATTERN =
  '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}' +
  '-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}';
const UUID_OR_ROOT_PATTERN = new RegExp(`^(root|${UUID_PATTERN})$`);

export class GetPageChildrenRequestDto {
  @ApiProperty({ example: '018fd1e8-3c74-7f41-9fb2-78a7790d1b2a' })
  @IsUUID()
  workspaceId!: string;

  @ApiProperty({
    example: 'root',
    description: 'Parent page id or root for workspace root pages.',
  })
  @IsString()
  @Matches(UUID_OR_ROOT_PATTERN)
  parentId!: string;

  @ApiPropertyOptional({ example: 50, default: 50, maximum: 50 })
  @IsOptional()
  @Matches(/^\d+$/)
  limit?: string;

  @ApiPropertyOptional({
    example: '018fd1e8-3c74-7f41-9fb2-78a7790d1b2a',
    description: 'Last page id from the previous page.',
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
