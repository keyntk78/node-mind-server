import { CreatePageCommand } from '@application/page/command/create-page.command';
import { GetPageChildrenQuery } from '@application/page/query/get-page-children.query';
import { GetPageDetailQuery } from '@application/page/query/get-page-detail.query';
import { CurrentUserId } from '@common/decorators/current-user.decorator';
import { PagesJwtAuthGuard } from '@common/guards/pages-jwt-auth.guard';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { ResponseService } from '@common/services/response.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePageRequestDto } from '../dto/notes/request/create-page-request.dto';
import { GetPageChildrenRequestDto } from '../dto/notes/request/get-page-children-request.dto';

@ApiTags('pages')
@Controller({
  path: 'pages',
  version: '1',
})
@UseGuards(PagesJwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor)
export class PagesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly responseService: ResponseService,
  ) {}

  @Get('children')
  @ApiOperation({ summary: 'Get child pages for lazy-loaded sidebar tree' })
  @ApiResponse({ status: 200, description: 'Pages retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Workspace access denied.' })
  async children(
    @Query() dto: GetPageChildrenRequestDto,
    @CurrentUserId() currentUserId: string,
  ) {
    const limit = this.normalizeLimit(dto.limit);
    const result = await this.queryBus.execute(
      new GetPageChildrenQuery(
        currentUserId,
        dto.workspaceId,
        dto.parentId,
        limit,
        dto.cursor,
      ),
    );

    return this.responseService.cursorPaginated(
      'Pages retrieved successfully',
      result.data,
      result.meta,
    );
  }

  @Get(':pageId')
  @ApiOperation({ summary: 'Get page detail' })
  @ApiResponse({ status: 200, description: 'Page retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Workspace access denied.' })
  @ApiResponse({ status: 404, description: 'Page not found.' })
  async getDetail(
    @Param('pageId') pageId: string,
    @CurrentUserId() currentUserId: string,
  ) {
    const result = await this.queryBus.execute(
      new GetPageDetailQuery(currentUserId, pageId),
    );

    return this.responseService.success('Page retrieved successfully', result);
  }

  @Post()
  @ApiOperation({ summary: 'Create a page' })
  @ApiResponse({ status: 201, description: 'Page created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Workspace access denied.' })
  @ApiResponse({ status: 404, description: 'Parent page not found.' })
  async create(
    @Body() dto: CreatePageRequestDto,
    @CurrentUserId() currentUserId: string,
  ) {
    const page = await this.commandBus.execute(
      new CreatePageCommand(
        currentUserId,
        dto.workspaceId,
        dto.parentId ?? null,
        dto.title,
        dto.icon,
      ),
    );

    return this.responseService.created(page, 'Page created successfully');
  }

  private normalizeLimit(limit?: string): number {
    if (!limit) {
      return 50;
    }

    return Math.min(Math.max(Number(limit), 1), 50);
  }
}
