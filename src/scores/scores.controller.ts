import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ScoresService } from './scores.service';
import { SaveDraftScoreDto } from './dto/save-draft-score.dto';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { BulkSubmitScoreDto } from './dto/bulk-submit-score.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Get('progress/stats')
  getProgress(@Query('sessionId') sessionId?: string) {
    return this.scoresService.getProgressStats(sessionId);
  }

  @Roles(Role.SUPERVISOR)
  @Post('bulk')
  bulkSubmit(
    @Body() dto: BulkSubmitScoreDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.scoresService.bulkSubmit(dto, user.id);
  }



  @Roles(Role.SUPERVISOR)
  @Post(':studentId')
  submitFinal(
    @Param('studentId') studentId: string,
    @Body() dto: SubmitScoreDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.scoresService.submitFinal(studentId, dto, user.id);
  }

  @Roles(Role.SUPERVISOR)
  @Patch(':studentId/draft')
  saveDraft(
    @Param('studentId') studentId: string,
    @Body() dto: SaveDraftScoreDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.scoresService.saveDraft(studentId, dto, user.id);
  }

  @Roles(Role.DIRECTOR, Role.CORPER, Role.SUPERVISOR)
  @Get(':studentId')
  findOne(@Param('studentId') studentId: string) {
    return this.scoresService.findByStudent(studentId);
  }
}
