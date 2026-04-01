import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionsService } from '../sessions/sessions.service';
import { Score } from '../scores/score.entity';
import { Student } from '../students/student.entity';
import { MarkBulkDto } from './dto/mark-bulk.dto';
import { MarkIndividualDto } from './dto/mark-individual.dto';

@Injectable()
export class OrientationService {
  constructor(
    @InjectRepository(Score)
    private readonly scoreRepo: Repository<Score>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly sessionsService: SessionsService,
  ) {}

  async getStatus(sessionId?: string) {
    const activeSessionId =
      sessionId ?? (await this.sessionsService.findActive()).id;

    const students = await this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.score', 'score')
      .where('student.sessionId = :sessionId', { sessionId: activeSessionId })
      .orderBy('student.name', 'ASC')
      .getMany();

    return students.map((student) => ({
      studentId: student.id,
      mark: student.score?.orientation ?? null,
    }));
  }

  async markAll() {
    const session = await this.sessionsService.findActive();
    const students = await this.studentRepo.find({
      where: { sessionId: session.id },
      select: { id: true },
    });

    for (const student of students) {
      await this.upsertOrientation(student.id, 10);
    }

    return { marked: students.length };
  }

  async markBulk(dto: MarkBulkDto) {
    const session = await this.sessionsService.findActive();
    const notFound: string[] = [];
    let marked = 0;

    for (const rawMatricNo of dto.matricNos) {
      const matricNo = rawMatricNo.trim().toUpperCase();
      const student = await this.studentRepo.findOne({
        where: { sessionId: session.id, matricNo },
      });

      if (!student) {
        notFound.push(rawMatricNo);
        continue;
      }

      await this.upsertOrientation(student.id, 10);
      marked += 1;
    }

    return { marked, notFound };
  }

  async markIndividual(dto: MarkIndividualDto) {
    for (const studentId of dto.studentIds) {
      await this.upsertOrientation(studentId, 10);
    }

    return { marked: dto.studentIds.length };
  }

  async previewBulk(matricNos: string[]) {
    const session = await this.sessionsService.findActive();
    const found: Array<{
      matricNo: string;
      name: string;
      department: string | null;
    }> = [];
    const notFound: string[] = [];

    for (const rawMatricNo of matricNos) {
      const matricNo = rawMatricNo.trim().toUpperCase();
      const student = await this.studentRepo.findOne({
        where: { sessionId: session.id, matricNo },
      });

      if (!student) {
        notFound.push(rawMatricNo);
        continue;
      }

      found.push({
        matricNo: student.matricNo,
        name: student.name,
        department: student.department,
      });
    }

    return { found, notFound };
  }

  private async upsertOrientation(studentId: string, orientation: number) {
    let score = await this.scoreRepo.findOne({ where: { studentId } });

    if (!score) {
      score = this.scoreRepo.create({
        studentId,
        orientation,
        isDraft: false,
      });
    } else {
      score.orientation = orientation;
    }

    await this.scoreRepo.save(score);
  }
}
