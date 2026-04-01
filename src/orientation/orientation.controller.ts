import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { OrientationService } from './orientation.service';
import { MarkBulkDto } from './dto/mark-bulk.dto';
import { MarkIndividualDto } from './dto/mark-individual.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orientation')
export class OrientationController {
  constructor(private readonly orientationService: OrientationService) {}

  @Roles(Role.CORPER)
  @Get()
  getStatus(@Query('sessionId') sessionId?: string) {
    return this.orientationService.getStatus(sessionId);
  }

  @Roles(Role.CORPER)
  @Post('mark-all')
  markAll() {
    return this.orientationService.markAll();
  }

  @Roles(Role.CORPER)
  @Post('mark-bulk')
  markBulk(@Body() dto: MarkBulkDto) {
    return this.orientationService.markBulk(dto);
  }

  @Roles(Role.CORPER)
  @Post('mark-individual')
  markIndividual(@Body() dto: MarkIndividualDto) {
    return this.orientationService.markIndividual(dto);
  }

  @Roles(Role.CORPER)
  @Post('preview-bulk')
  previewBulk(@Body() dto: MarkBulkDto) {
    return this.orientationService.previewBulk(dto.matricNos);
  }
}
