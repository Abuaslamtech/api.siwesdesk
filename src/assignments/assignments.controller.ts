import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AssignmentsService } from './assignments.service';
import { BulkAssignDto } from './dto/bulk-assign.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Roles(Role.DIRECTOR)
  @Post('bulk')
  bulkAssign(@Body() dto: BulkAssignDto) {
    return this.assignmentsService.bulkAssign(dto);
  }

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Get()
  findAll(@Query('sessionId') sessionId?: string) {
    return this.assignmentsService.findAll(sessionId);
  }

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Get('unassigned')
  findUnassigned() {
    return this.assignmentsService.findUnassigned();
  }

  @Roles(Role.SUPERVISOR)
  @Get('my-students')
  myStudents(@CurrentUser() user: { id: string }) {
    return this.assignmentsService.findBySupervisor(user.id);
  }
}
