import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UploadStudentsDto } from './dto/upload-students.dto';
import { StudentsService } from './students.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Post('upload')
  upload(@Body() dto: UploadStudentsDto) {
    return this.studentsService.upload(dto);
  }

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Get()
  findAll(
    @Query('sessionId') sessionId?: string,
    @Query('faculty') faculty?: string,
    @Query('department') department?: string,
    @Query('course') course?: string,
    @Query('state') state?: string,
    @Query('industry') industry?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.studentsService.findAll({
      sessionId,
      faculty,
      department,
      course,
      state,
      industry,
      status,
      search,
    });
  }

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Get('departments')
  getDepartments() {
    return this.studentsService.getDepartments();
  }

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Get('faculties')
  getFaculties() {
    return this.studentsService.getFaculties();
  }

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Get('courses')
  getCourses() {
    return this.studentsService.getCourses();
  }

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Get('states')
  getStates() {
    return this.studentsService.getStates();
  }

  @Roles(Role.DIRECTOR, Role.CORPER)
  @Get('industries')
  getIndustries() {
    return this.studentsService.getIndustries();
  }

  // ── Public endpoint — no authentication required ─────────────────────────
  // Must be declared BEFORE @Get(':id') so NestJS does not treat
  // the literal string "result" as an :id parameter.
  @Get('result')
  lookupResult(@Query('matricNo') matricNo: string) {
    return this.studentsService.findByMatricNo(matricNo);
  }

  @Roles(Role.DIRECTOR, Role.CORPER, Role.SUPERVISOR)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }
}
