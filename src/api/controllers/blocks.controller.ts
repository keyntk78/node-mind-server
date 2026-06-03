import { CreateBlockCommand } from '@application/block/command/create-block.command';
import { UpdateBlockCommand } from '@application/block/command/update-block.command';
import { CurrentUserId } from '@common/decorators/current-user.decorator';
import { PagesJwtAuthGuard } from '@common/guards/pages-jwt-auth.guard';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { ResponseService } from '@common/services/response.service';
import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CreateBlockRequestDto } from '../dto/blocks/request/create-block-request.dto';
import { UpdateBlockRequestDto } from '../dto/blocks/request/update-block-request.dto';

@ApiTags('blocks')
@Controller({
  path: 'pages/:pageId/blocks',
  version: '1',
})
@UseGuards(PagesJwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor)
export class BlocksController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a block in a page' })
  @ApiResponse({ status: 201, description: 'Block created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Workspace access denied.' })
  @ApiResponse({ status: 404, description: 'Page not found.' })
  async create(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Body() dto: CreateBlockRequestDto,
    @CurrentUserId() currentUserId: string,
  ) {
    const block = await this.commandBus.execute(
      new CreateBlockCommand(
        currentUserId,
        pageId,
        dto.type,
        dto.content,
        dto.orderIndex,
      ),
    );

    return this.responseService.created(block, 'Block created successfully');
  }
}

@ApiTags('blocks')
@Controller({
  path: 'blocks',
  version: '1',
})
@UseGuards(PagesJwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor)
export class BlockItemsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly responseService: ResponseService,
  ) {}

  @Patch(':blockId')
  @ApiOperation({ summary: 'Update a block content' })
  @ApiResponse({ status: 200, description: 'Block updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Workspace access denied.' })
  @ApiResponse({ status: 404, description: 'Block or page not found.' })
  async update(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: UpdateBlockRequestDto,
    @CurrentUserId() currentUserId: string,
  ) {
    const block = await this.commandBus.execute(
      new UpdateBlockCommand(currentUserId, blockId, dto.content),
    );

    return this.responseService.updated(block, 'Block updated successfully');
  }
}
