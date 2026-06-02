import { CreatePageCommand } from '@application/notes/command/create-page.command';
import { CurrentUserId } from '@common/decorators/current-user.decorator';
import { PagesJwtAuthGuard } from '@common/guards/pages-jwt-auth.guard';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { ResponseService } from '@common/services/response.service';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePageRequestDto } from '../dto/notes/request/create-page-request.dto';

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
    private readonly responseService: ResponseService,
  ) {}

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
}
