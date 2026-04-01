import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import { SessionsService } from '../sessions/sessions.service';
import { Student } from '../students/student.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly sessionsService: SessionsService,
  ) {}

  async generateInternalReport(sessionId?: string) {
    const resolvedSessionId =
      sessionId ?? (await this.sessionsService.findActive()).id;
    const session = await this.sessionsService.findById(resolvedSessionId);

    const students = await this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.assignment', 'assignment')
      .leftJoinAndSelect('assignment.supervisor', 'supervisor')
      .leftJoinAndSelect('student.score', 'score')
      .where('student.sessionId = :sessionId', { sessionId: resolvedSessionId })
      .orderBy('student.department', 'ASC')
      .addOrderBy('student.name', 'ASC')
      .getMany();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`SIWES ${session.year} Internal`);

    sheet.columns = [
      { header: 'Matric No', key: 'matricNo', width: 18 },
      { header: 'Surname', key: 'surname', width: 18 },
      { header: 'Other Names', key: 'otherNames', width: 24 },
      { header: 'Department', key: 'department', width: 24 },
      { header: 'Course', key: 'course', width: 22 },
      { header: 'Level', key: 'level', width: 10 },
      { header: 'State', key: 'state', width: 16 },
      { header: 'LGA', key: 'lga', width: 18 },
      { header: 'Industry', key: 'industry', width: 30 },
      { header: 'Location', key: 'location', width: 22 },
      { header: 'Supervisor', key: 'supervisor', width: 26 },
      { header: 'Orientation /10', key: 'orientation', width: 16 },
      { header: 'Supervisor /40', key: 'supervisorScore', width: 16 },
      { header: 'Industry /50', key: 'industryScore', width: 14 },
      { header: 'Total /100', key: 'total', width: 12 },
      { header: 'SIWES Score /50', key: 'siewesFinal', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4B5563' }, // A nice dark gray
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;

    for (const student of students) {
      const total =
        (student.score?.orientation ?? 0) +
        (student.score?.supervisorScore ?? 0) +
        (student.score?.industryScore ?? 0);
      const isComplete =
        !!student.score &&
        !student.score.isDraft &&
        student.score.orientation !== null &&
        student.score.supervisorScore !== null &&
        student.score.industryScore !== null;

      sheet.addRow({
        matricNo: student.matricNo,
        surname: student.surname,
        otherNames: student.otherNames,
        department: student.department ?? '—',
        course: student.course ?? '—',
        level: student.level,
        state: student.state,
        lga: student.lga ?? '—',
        industry: student.industry ?? '—',
        location: student.location ?? '—',
        supervisor: student.assignment?.supervisor?.name ?? 'Unassigned',
        orientation:
          student.score?.orientation !== null
            ? student.score?.orientation
            : '—',
        supervisorScore:
          student.score?.supervisorScore !== null
            ? student.score?.supervisorScore
            : '—',
        industryScore:
          student.score?.industryScore !== null
            ? student.score?.industryScore
            : '—',
        total: student.score ? total : '—',
        siewesFinal: student.score ? total / 2 : '—',
        status: !student.assignment
          ? 'Unassigned'
          : isComplete
            ? 'Completed'
            : student.score
              ? 'Partial'
              : 'Assigned',
      });
    }

    // Apply borders and alternating row colors to all rows
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        // Add alternating row colors (skip header)
        if (rowNumber > 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowNumber % 2 === 0 ? 'FFF9FAFB' : 'FFFFFFFF' },
          };
        }
      });
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle' };
      }
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async generateExternalReport(sessionId?: string, includeIncomplete = false) {
    const resolvedSessionId =
      sessionId ?? (await this.sessionsService.findActive()).id;
    const session = await this.sessionsService.findById(resolvedSessionId);

    const students = await this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.score', 'score')
      .where('student.sessionId = :sessionId', { sessionId: resolvedSessionId })
      .orderBy('student.department', 'ASC')
      .addOrderBy('student.name', 'ASC')
      .getMany();

    const filteredStudents = students.filter((student) => {
      if (includeIncomplete) {
        return true;
      }

      return (
        !!student.score &&
        !student.score.isDraft &&
        student.score.orientation !== null &&
        student.score.supervisorScore !== null &&
        student.score.industryScore !== null
      );
    });

    const grouped = filteredStudents.reduce<Record<string, Student[]>>(
      (acc, student) => {
        const key = student.department || student.course || 'General';
        acc[key] ??= [];
        acc[key].push(student);
        return acc;
      },
      {},
    );

    const workbook = new ExcelJS.Workbook();
    for (const [department, departmentStudents] of Object.entries(grouped)) {
      const sheet = workbook.addWorksheet(
        department.replace(/[\\/*?:[\]]/g, '').slice(0, 31) || 'General',
      );

      const headers = includeIncomplete
        ? ['Matric No', 'Surname', 'Other Names', 'SIWES Score /50', 'Status']
        : ['Matric No', 'Surname', 'Other Names', 'SIWES Score /50'];

      sheet.columns = [
        { width: 18 },
        { width: 18 },
        { width: 24 },
        { width: 18 },
        ...(includeIncomplete ? [{ width: 16 }] : []),
      ];

      const titleRow = sheet.addRow([`SIWES ${session.year} - ${department}`]);
      titleRow.font = { bold: true, size: 14, color: { argb: 'FF111827' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 30;
      sheet.mergeCells(1, 1, 1, headers.length);

      const headerRow = sheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4B5563' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 24;

      for (const student of departmentStudents) {
        const total =
          (student.score?.orientation ?? 0) +
          (student.score?.supervisorScore ?? 0) +
          (student.score?.industryScore ?? 0);
        const isComplete =
          !!student.score &&
          !student.score.isDraft &&
          student.score.orientation !== null &&
          student.score.supervisorScore !== null &&
          student.score.industryScore !== null;

        const baseRow = [
          student.matricNo,
          student.surname,
          student.otherNames,
          isComplete ? total / 2 : '—',
        ];

        sheet.addRow(
          includeIncomplete
            ? [...baseRow, isComplete ? 'Complete' : 'Incomplete']
            : baseRow,
        );
      }

      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          if (rowNumber > 2) {
            row.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: rowNumber % 2 === 0 ? 'FFF9FAFB' : 'FFFFFFFF' },
            };
          }
        });
        if (rowNumber > 2) {
          row.alignment = { vertical: 'middle' };
        }
      });
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
