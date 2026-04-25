import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from '../assignments/assignment.entity';
import { SessionsService } from '../sessions/sessions.service';
import { Student } from '../students/student.entity';
import { Score } from './score.entity';
import { SaveDraftScoreDto } from './dto/save-draft-score.dto';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { BulkSubmitScoreDto } from './dto/bulk-submit-score.dto';

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    private readonly sessionsService: SessionsService,
  ) {}

  async submitFinal(
    studentId: string,
    dto: SubmitScoreDto,
    supervisorId: string,
  ) {
    await this.ensureAssignedStudent(studentId, supervisorId);

    let score = await this.scoreRepo.findOne({ where: { studentId } });
    if (!score) {
      score = this.scoreRepo.create({ studentId });
    }

    score.supervisorScore = dto.supervisorScore;
    score.industryScore = dto.industryScore;
    score.enteredById = supervisorId;
    score.isDraft = false;

    const saved = await this.scoreRepo.save(score);
    return this.withComputed(saved);
  }

  async bulkSubmit(dto: BulkSubmitScoreDto, supervisorId: string) {
    const results = await Promise.allSettled(
      dto.entries.map(async (entry) => {
        await this.ensureAssignedStudent(entry.studentId, supervisorId);

        let score = await this.scoreRepo.findOne({
          where: { studentId: entry.studentId },
        });
        if (!score) {
          score = this.scoreRepo.create({ studentId: entry.studentId });
        }

        score.supervisorScore = entry.supervisorScore;
        score.industryScore = entry.industryScore;
        score.enteredById = supervisorId;
        score.isDraft = false;

        const saved = await this.scoreRepo.save(score);
        return { studentId: entry.studentId, status: 'ok' as const, score: this.withComputed(saved) };
      }),
    );

    const summary = results.map((result, i) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      const err = result.reason as Error;
      return {
        studentId: dto.entries[i].studentId,
        status: 'error' as const,
        message: err?.message ?? 'Unknown error',
      };
    });

    const succeeded = summary.filter((r) => r.status === 'ok').length;
    const failed = summary.filter((r) => r.status === 'error').length;

    return { succeeded, failed, results: summary };
  }

  async saveDraft(
    studentId: string,
    dto: SaveDraftScoreDto,
    supervisorId: string,
  ) {
    await this.ensureAssignedStudent(studentId, supervisorId);

    let score = await this.scoreRepo.findOne({ where: { studentId } });
    if (!score) {
      score = this.scoreRepo.create({ studentId });
    }

    if (dto.supervisorScore !== undefined) {
      score.supervisorScore = dto.supervisorScore;
    }

    if (dto.industryScore !== undefined) {
      score.industryScore = dto.industryScore;
    }

    score.enteredById = supervisorId;
    score.isDraft = true;

    const saved = await this.scoreRepo.save(score);
    return this.withComputed(saved);
  }

  async findByStudent(studentId: string) {
    const score = await this.scoreRepo.findOne({ where: { studentId } });
    return score ? this.withComputed(score) : null;
  }

  async getProgressStats(sessionId?: string) {
    const activeSessionId =
      sessionId ?? (await this.sessionsService.findActive()).id;

    const [totalStudents, assigned, orientationMarked, fullyScored] =
      await Promise.all([
        this.studentRepo.count({ where: { sessionId: activeSessionId } }),
        this.assignmentRepo
          .createQueryBuilder('assignment')
          .innerJoin('assignment.student', 'student')
          .where('student.sessionId = :sessionId', {
            sessionId: activeSessionId,
          })
          .getCount(),
        this.scoreRepo
          .createQueryBuilder('score')
          .innerJoin('score.student', 'student')
          .where('student.sessionId = :sessionId', {
            sessionId: activeSessionId,
          })
          .andWhere('score.orientation IS NOT NULL')
          .getCount(),
        this.scoreRepo
          .createQueryBuilder('score')
          .innerJoin('score.student', 'student')
          .where('student.sessionId = :sessionId', {
            sessionId: activeSessionId,
          })
          .andWhere('score.orientation IS NOT NULL')
          .andWhere('score.supervisorScore IS NOT NULL')
          .andWhere('score.industryScore IS NOT NULL')
          .andWhere('score.isDraft = false')
          .getCount(),
      ]);

    const perSupervisorRaw = await this.assignmentRepo
      .createQueryBuilder('assignment')
      .innerJoin('assignment.supervisor', 'supervisor')
      .innerJoin('assignment.student', 'student')
      .leftJoin('student.score', 'score')
      .select('assignment.supervisorId', 'supervisorId')
      .addSelect('supervisor.name', 'name')
      .addSelect('supervisor.email', 'email')
      .addSelect('supervisor.role', 'role')
      .addSelect('supervisor.createdAt', 'createdAt')
      .addSelect('COUNT(assignment.id)', 'total')
      .addSelect(
        `
          SUM(
            CASE
              WHEN score.orientation IS NOT NULL
                AND score.supervisorScore IS NOT NULL
                AND score.industryScore IS NOT NULL
                AND score.isDraft = false
              THEN 1
              ELSE 0
            END
          )
        `,
        'scored',
      )
      .where('student.sessionId = :sessionId', { sessionId: activeSessionId })
      .groupBy('assignment.supervisorId')
      .addGroupBy('supervisor.name')
      .addGroupBy('supervisor.email')
      .addGroupBy('supervisor.role')
      .addGroupBy('supervisor.createdAt')
      .orderBy('supervisor.name', 'ASC')
      .getRawMany();

    const perSupervisor = perSupervisorRaw.map(
      (row: {
        supervisorId: string;
        name: string;
        email: string;
        role: string;
        createdAt: Date;
        total: string | number;
        scored: string | number;
      }) => {
        const total = Number(row.total);
        const scored = Number(row.scored);

        return {
          supervisor: {
            id: row.supervisorId,
            name: row.name,
            email: row.email,
            role: row.role,
            createdAt: row.createdAt,
          },
          total,
          scored,
          pending: total - scored,
        };
      },
    );

    return {
      totalStudents,
      assigned,
      unassigned: totalStudents - assigned,
      orientationMarked,
      fullyScored,
      pending: totalStudents - fullyScored,
      completionPercentage:
        totalStudents > 0 ? Math.round((fullyScored / totalStudents) * 100) : 0,
      perSupervisor,
    };
  }

  private async ensureAssignedStudent(studentId: string, supervisorId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const assignment = await this.assignmentRepo.findOne({
      where: { studentId, supervisorId },
    });

    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this student');
    }
  }

  private withComputed(score: Score) {
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
