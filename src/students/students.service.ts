import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionsService } from '../sessions/sessions.service';
import { Score } from '../scores/score.entity';
import { Student } from './student.entity';
import { UploadStudentsDto } from './dto/upload-students.dto';

type StudentFilters = {
  sessionId?: string;
  faculty?: string;
  department?: string;
  course?: string;
  state?: string;
  industry?: string;
  status?: string;
  search?: string;
};

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly repo: Repository<Student>,
    private readonly sessionsService: SessionsService,
  ) {}

  async upload(dto: UploadStudentsDto) {
    const session = await this.sessionsService.findActive();
    return this.repo.manager.transaction(async (manager) => {
      const studentRepo = manager.getRepository(Student);
      const existingStudents = await studentRepo.find({
        where: { sessionId: session.id },
        select: {
          matricNo: true,
        },
      });
      const seen = new Set(existingStudents.map((student) => student.matricNo));
      const inserts: Array<Partial<Student>> = [];
      let skipped = 0;

      for (const row of dto.students) {
        const matricNo = row.matricNo.trim().toUpperCase();
        if (seen.has(matricNo)) {
          skipped += 1;
          continue;
        }

        seen.add(matricNo);
        inserts.push({
          sessionId: session.id,
          matricNo,
          surname: row.surname.trim(),
          otherNames: row.otherNames.trim(),
          name: `${row.surname.trim()} ${row.otherNames.trim()}`.trim(),
          department: this.optional(row.department),
          faculty: this.optional(row.faculty),
          course: this.optional(row.course),
          level: row.level.trim(),
          state: row.state.trim(),
          lga: this.optional(row.lga),
          industry: this.optional(row.industry),
          location: this.optional(row.location),
          email: this.optional(row.email)?.toLowerCase() ?? null,
          phone: this.optional(row.phone),
          gender: this.optional(row.gender),
        });
      }

      const chunkSize = 250;
      for (let index = 0; index < inserts.length; index += chunkSize) {
        await studentRepo.insert(inserts.slice(index, index + chunkSize));
      }

      return { uploaded: inserts.length, skipped };
    });
  }

  async findAll(filters: StudentFilters = {}) {
    const sessionId =
      filters.sessionId?.trim() || (await this.sessionsService.findActive()).id;

    const qb = this.repo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.assignment', 'assignment')
      .leftJoinAndSelect('assignment.supervisor', 'supervisor')
      .leftJoinAndSelect('student.score', 'score')
      .where('student.sessionId = :sessionId', { sessionId });

    if (filters.faculty) {
      qb.andWhere('student.faculty = :faculty', { faculty: filters.faculty });
    }

    if (filters.department) {
      qb.andWhere('student.department = :department', {
        department: filters.department,
      });
    }

    if (filters.course) {
      qb.andWhere('student.course = :course', { course: filters.course });
    }

    if (filters.state) {
      qb.andWhere('student.state = :state', { state: filters.state });
    }

    if (filters.industry) {
      qb.andWhere('student.industry = :industry', {
        industry: filters.industry,
      });
    }

    if (filters.search) {
      qb.andWhere(
        `
          student.name ILIKE :search
          OR student.matricNo ILIKE :search
          OR COALESCE(student.course, '') ILIKE :search
          OR COALESCE(student.faculty, '') ILIKE :search
        `,
        { search: `%${filters.search}%` },
      );
    }

    const students = await qb.orderBy('student.name', 'ASC').getMany();

    return students
      .map((student) => this.decorateStudent(student))
      .filter(
        (student) => !filters.status || student.status === filters.status,
      );
  }

  async findById(id: string) {
    const student = await this.repo.findOne({
      where: { id },
      relations: ['assignment', 'assignment.supervisor', 'score'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.decorateStudent(student);
  }

  async getDepartments() {
    return this.getDistinctValues('department');
  }

  async getFaculties() {
    return this.getDistinctValues('faculty');
  }

  async getCourses() {
    return this.getDistinctValues('course');
  }

  async getStates() {
    return this.getDistinctValues('state');
  }

  async getIndustries() {
    return this.getDistinctValues('industry');
  }

  private async getDistinctValues(
    field: 'department' | 'faculty' | 'course' | 'state' | 'industry',
  ): Promise<string[]> {
    const session = await this.sessionsService.findActive();
    const rows = await this.repo
      .createQueryBuilder('student')
      .select(`DISTINCT student.${field}`, field)
      .where('student.sessionId = :sessionId', { sessionId: session.id })
      .andWhere(`student.${field} IS NOT NULL`)
      .andWhere(`student.${field} <> ''`)
      .orderBy(`student.${field}`, 'ASC')
      .getRawMany();

    return rows
      .map((row: Record<string, string>) => row[field])
      .filter(Boolean);
  }

  private decorateStudent(student: Student) {
    const score = student.score ? this.decorateScore(student.score) : undefined;

    return {
      ...student,
      score,
      status: this.computeStatus(student.assignment, score),
    };
  }

  private decorateScore(score: Score) {
    const orientation = score.orientation ?? 0;
    const supervisorScore = score.supervisorScore ?? 0;
    const industryScore = score.industryScore ?? 0;
    const total = orientation + supervisorScore + industryScore;

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

  private computeStatus(
    assignment: Student['assignment'],
    score?: ReturnType<StudentsService['decorateScore']>,
  ) {
    if (!assignment) {
      return 'unassigned';
    }

    if (!score) {
      return 'assigned';
    }

    return score.isComplete ? 'completed' : 'partially-scored';
  }

  private optional(value?: string) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
