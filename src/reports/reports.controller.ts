import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(Role.CORPER)
  @Get('export/internal')
  async exportInternal(
    @Res() res: Response,
    @Query('sessionId') sessionId?: string,
  ) {
    const buffer = await this.reportsService.generateInternalReport(sessionId);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="siwesdesk-internal-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Roles(Role.CORPER)
  @Get('export/external')
  async exportExternal(
    @Res() res: Response,
    @Query('sessionId') sessionId?: string,
    @Query('includeIncomplete') includeIncomplete?: string,
  ) {
    const buffer = await this.reportsService.generateExternalReport(
      sessionId,
      includeIncomplete === 'true',
    );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="siwesdesk-external-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
