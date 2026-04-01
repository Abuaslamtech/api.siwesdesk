import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionsService } from './sessions.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Roles(Role.DIRECTOR)
  @Post()
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Get()
  findAll() {
    return this.sessionsService.findAll();
  }

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Get('active')
  findActive() {
    return this.sessionsService.findActive();
  }

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findById(id);
  }
}
