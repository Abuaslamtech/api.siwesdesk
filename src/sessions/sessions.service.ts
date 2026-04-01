import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../students/student.entity';
import { Score } from '../scores/score.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { Session } from './session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly repo: Repository<Session>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
  ) {}

  async create(dto: CreateSessionDto) {
    const existing = await this.repo.findOne({ where: { year: dto.year } });
    if (existing) {
      throw new ConflictException(`Session ${dto.year} already exists`);
    }

    await this.repo.update({ isActive: true }, { isActive: false });
    const saved = await this.repo.save(
      this.repo.create({ year: dto.year, isActive: true }),
    );

    return this.decorateSession(saved);
  }

  async findAll() {
    const sessions = await this.repo.find({ order: { year: 'DESC' } });
    return Promise.all(sessions.map((session) => this.decorateSession(session)));
  }

  async findActive() {
    const session = await this.repo.findOne({ where: { isActive: true } });
    if (!session) {
      throw new NotFoundException('No active session found');
    }

    return this.decorateSession(session);
  }

  async findById(id: string) {
    const session = await this.repo.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.decorateSession(session);
  }

  private async decorateSession(session: Session) {
    const [studentCount, scoredCount] = await Promise.all([
      this.studentRepo.count({ where: { sessionId: session.id } }),
      this.scoreRepo
        .createQueryBuilder('score')
        .innerJoin('score.student', 'student')
        .where('student.sessionId = :sessionId', { sessionId: session.id })
        .andWhere('score.orientation IS NOT NULL')
        .andWhere('score.supervisorScore IS NOT NULL')
        .andWhere('score.industryScore IS NOT NULL')
        .andWhere('score.isDraft = false')
        .getCount(),
    ]);

    return {
      ...session,
      studentCount,
      scoredCount,
    };
  }
}
