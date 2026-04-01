import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { Score } from '../scores/score.entity';
import { Student } from '../students/student.entity';
import { Assignment } from './assignment.entity';
import { BulkAssignDto } from './dto/bulk-assign.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private readonly repo: Repository<Assignment>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {}

  async bulkAssign(dto: BulkAssignDto) {
    const supervisor = await this.usersService.findById(dto.supervisorId);
    if (supervisor.role !== Role.SUPERVISOR) {
      throw new ForbiddenException('Selected user is not a supervisor');
    }

    const session = await this.sessionsService.findActive();
    const students = await this.studentRepo.find({
      where: { sessionId: session.id },
      select: { id: true },
    });
    const studentIds = new Set(students.map((student) => student.id));

    for (const studentId of dto.studentIds) {
      if (!studentIds.has(studentId)) {
        throw new BadRequestException(
          'One or more selected students are not in the active session',
        );
      }
    }

    for (const studentId of dto.studentIds) {
      const existing = await this.repo.findOne({ where: { studentId } });

      if (existing) {
        existing.supervisorId = dto.supervisorId;
        await this.repo.save(existing);
      } else {
        await this.repo.save(
          this.repo.create({
            studentId,
            supervisorId: dto.supervisorId,
          }),
        );
      }
    }

    return { assigned: dto.studentIds.length };
  }

  async findAll(sessionId?: string) {
    const activeSessionId =
      sessionId ?? (await this.sessionsService.findActive()).id;

    return this.repo
      .createQueryBuilder('assignment')
      .innerJoinAndSelect('assignment.student', 'student')
      .innerJoinAndSelect('assignment.supervisor', 'supervisor')
      .where('student.sessionId = :sessionId', { sessionId: activeSessionId })
      .orderBy('student.name', 'ASC')
      .getMany();
  }

  async findUnassigned() {
    const session = await this.sessionsService.findActive();

    return this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.assignment', 'assignment')
      .where('student.sessionId = :sessionId', { sessionId: session.id })
      .andWhere('assignment.id IS NULL')
      .orderBy('student.name', 'ASC')
      .getMany();
  }

  async findBySupervisor(supervisorId: string) {
    const session = await this.sessionsService.findActive();
    const students = await this.studentRepo
      .createQueryBuilder('student')
      .innerJoinAndSelect('student.assignment', 'assignment')
      .innerJoinAndSelect('assignment.supervisor', 'supervisor')
      .leftJoinAndSelect('student.score', 'score')
      .where('student.sessionId = :sessionId', { sessionId: session.id })
      .andWhere('assignment.supervisorId = :supervisorId', { supervisorId })
      .orderBy('student.name', 'ASC')
      .getMany();

    return students.map((student) => {
      const score = student.score ? this.decorateScore(student.score) : undefined;

      return {
        ...student,
        score,
        status: !score
          ? 'assigned'
          : score.isComplete
            ? 'completed'
            : 'partially-scored',
      };
    });
  }

  private decorateScore(score: Score) {
    const total =
      (score.orientation ?? 0) +
      (score.supervisorScore ?? 0) +
      (score.industryScore ?? 0);

    return {
      ...score,
      total,
      siewesFinal: total / 2,
      isComplete:
        !score.isDraft &&
        score.orientation !== null &&
        score.supervisorScore !== null &&
        score.industryScore !== null,
    };
  }
}
