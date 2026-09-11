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
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'WhatsApp', key: 'whatsappNumber', width: 16 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'State', key: 'state', width: 16 },
      { header: 'LGA / Area', key: 'lga', width: 18 },
      { header: 'Industry Placement', key: 'industry', width: 30 },
      { header: 'Placement Address', key: 'address', width: 30 },
      { header: 'Duration', key: 'siwesDuration', width: 16 },
      { header: 'Industry Supervisor', key: 'industrySupervisorName', width: 26 },
      { header: 'Industry Sup. Phone', key: 'industrySupervisorPhone', width: 20 },
      { header: 'Bank Name', key: 'bankName', width: 20 },
      { header: 'Account Name', key: 'accountName', width: 24 },
      { header: 'Account Number', key: 'accountNumber', width: 18 },
      { header: 'Sort Code', key: 'sortCode', width: 14 },
      { header: 'Institutional Supervisor', key: 'supervisor', width: 26 },
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
        phone: student.phone ?? '—',
        whatsappNumber: student.whatsappNumber ?? '—',
        email: student.email ?? '—',
        state: student.state,
        lga: student.lga ?? student.location ?? '—',
        industry: student.industry ?? '—',
        address: student.address ?? '—',
        siwesDuration: student.siwesDuration ?? '—',
        industrySupervisorName: student.industrySupervisorName ?? '—',
        industrySupervisorPhone: student.industrySupervisorPhone ?? '—',
        bankName: student.bankName ?? '—',
        accountName: student.accountName ?? '—',
        accountNumber: student.accountNumber ?? '—',
        sortCode: student.sortCode ?? '—',
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

  async generateMasterList(sessionId?: string) {
    const resolvedSessionId =
      sessionId ?? (await this.sessionsService.findActive()).id;
    const session = await this.sessionsService.findById(resolvedSessionId);

    const students = await this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.assignment', 'assignment')
      .leftJoinAndSelect('assignment.supervisor', 'supervisor')
      .where('student.sessionId = :sessionId', { sessionId: resolvedSessionId })
      .orderBy('student.faculty', 'ASC')
      .addOrderBy('student.course', 'ASC')
      .addOrderBy('student.name', 'ASC')
      .getMany();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`SIWES ${session.year} Master List`);

    sheet.columns = [
      { header: 'Email Address', key: 'email', width: 28 },
      { header: 'Name in Full (Surname in Capital Letter)', key: 'name', width: 30 },
      { header: 'Surname', key: 'surname', width: 18 },
      { header: 'Other Names', key: 'otherNames', width: 22 },
      { header: 'Matric. Number', key: 'matricNo', width: 18 },
      { header: 'Level', key: 'level', width: 10 },
      { header: 'Programme of Study', key: 'course', width: 26 },
      { header: 'Faculty', key: 'faculty', width: 26 },
      { header: 'Department', key: 'department', width: 24 },
      { header: 'WhatsApp Number Only', key: 'whatsappNumber', width: 18 },
      { header: 'Phone Number', key: 'phone', width: 18 },
      { header: 'Bank Name', key: 'bankName', width: 22 },
      { header: 'Account Name', key: 'accountName', width: 26 },
      { header: 'Account Number', key: 'accountNumber', width: 18 },
      { header: 'Sort Code', key: 'sortCode', width: 14 },
      { header: 'SIWES Placement', key: 'industry', width: 32 },
      { header: 'Address SIWES placement', key: 'address', width: 34 },
      { header: 'Area/Local Government/Town/', key: 'lga', width: 22 },
      { header: 'State', key: 'state', width: 16 },
      { header: 'Industry-based Supervisor Name', key: 'industrySupervisorName', width: 28 },
      { header: 'Industry-based Supervisor Phone Number', key: 'industrySupervisorPhone', width: 24 },
      { header: 'Duration of SIWES Exercise', key: 'siwesDuration', width: 18 },
      { header: 'Assigned Institutional Supervisor', key: 'supervisor', width: 28 },
      { header: 'Assignment Status', key: 'status', width: 16 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Deep blue
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 26;

    for (const student of students) {
      sheet.addRow({
        email: student.email ?? '—',
        name: student.name,
        surname: student.surname,
        otherNames: student.otherNames,
        matricNo: student.matricNo,
        level: student.level,
        course: student.course ?? '—',
        faculty: student.faculty ?? '—',
        department: student.department ?? '—',
        whatsappNumber: student.whatsappNumber ?? '—',
        phone: student.phone ?? '—',
        bankName: student.bankName ?? '—',
        accountName: student.accountName ?? '—',
        accountNumber: student.accountNumber ?? '—',
        sortCode: student.sortCode ?? '—',
        industry: student.industry ?? '—',
        address: student.address ?? '—',
        lga: student.lga ?? student.location ?? '—',
        state: student.state,
        industrySupervisorName: student.industrySupervisorName ?? '—',
        industrySupervisorPhone: student.industrySupervisorPhone ?? '—',
        siwesDuration: student.siwesDuration ?? '—',
        supervisor: student.assignment?.supervisor?.name ?? 'Unassigned',
        status: student.assignment ? 'Assigned' : 'Unassigned',
      });
    }

    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
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

  async generateSupervisorScoresReport(sessionId?: string) {
    const resolvedSessionId =
      sessionId ?? (await this.sessionsService.findActive()).id;
    const session = await this.sessionsService.findById(resolvedSessionId);

    const students = await this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.assignment', 'assignment')
      .leftJoinAndSelect('assignment.supervisor', 'supervisor')
      .leftJoinAndSelect('student.score', 'score')
      .where('student.sessionId = :sessionId', { sessionId: resolvedSessionId })
      .orderBy("COALESCE(supervisor.name, 'ZZZ')", 'ASC')
      .addOrderBy('student.name', 'ASC')
      .getMany();

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Individual Scores
    const scoresSheet = workbook.addWorksheet(`Supervisor Uploaded Scores`);

    scoresSheet.columns = [
      { header: 'Matric No', key: 'matricNo', width: 18 },
      { header: 'Student Name', key: 'name', width: 28 },
      { header: 'Faculty', key: 'faculty', width: 24 },
      { header: 'Course / Department', key: 'course', width: 24 },
      { header: 'Level', key: 'level', width: 10 },
      { header: 'Placement Establishment', key: 'industry', width: 28 },
      { header: 'State', key: 'state', width: 16 },
      { header: 'Assigned Supervisor', key: 'supervisor', width: 26 },
      { header: 'Supervisor Email', key: 'supervisorEmail', width: 26 },
      { header: 'Orientation /10', key: 'orientation', width: 16 },
      { header: 'Supervisor Score /40', key: 'supervisorScore', width: 20 },
      { header: 'Industry Score /50', key: 'industryScore', width: 18 },
      { header: 'Total Score /100', key: 'total', width: 16 },
      { header: 'SIWES Final /50', key: 'siewesFinal', width: 16 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Submitted At', key: 'submittedAt', width: 22 },
    ];

    const scoreHeaderRow = scoresSheet.getRow(1);
    scoreHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    scoreHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF15803D' }, // Rich dark green
    };
    scoreHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    scoreHeaderRow.height = 26;

    // Track supervisor statistics
    const supervisorStats: Record<
      string,
      { name: string; email: string; assigned: number; scored: number }
    > = {};

    for (const student of students) {
      const score = student.score;
      const total =
        (score?.orientation ?? 0) +
        (score?.supervisorScore ?? 0) +
        (score?.industryScore ?? 0);
      const isComplete =
        !!score &&
        !score.isDraft &&
        score.orientation !== null &&
        score.supervisorScore !== null &&
        score.industryScore !== null;

      const supervisor = student.assignment?.supervisor;
      if (supervisor) {
        if (!supervisorStats[supervisor.id]) {
          supervisorStats[supervisor.id] = {
            name: supervisor.name,
            email: supervisor.email,
            assigned: 0,
            scored: 0,
          };
        }
        supervisorStats[supervisor.id].assigned += 1;
        if (isComplete) {
          supervisorStats[supervisor.id].scored += 1;
        }
      }

      scoresSheet.addRow({
        matricNo: student.matricNo,
        name: student.name,
        faculty: student.faculty ?? '—',
        course: student.course ?? student.department ?? '—',
        level: student.level,
        industry: student.industry ?? '—',
        state: student.state,
        supervisor: supervisor?.name ?? 'Unassigned',
        supervisorEmail: supervisor?.email ?? '—',
        orientation:
          score?.orientation !== null && score?.orientation !== undefined
            ? score.orientation
            : '—',
        supervisorScore:
          score?.supervisorScore !== null && score?.supervisorScore !== undefined
            ? score.supervisorScore
            : '—',
        industryScore:
          score?.industryScore !== null && score?.industryScore !== undefined
            ? score.industryScore
            : '—',
        total: score ? total : '—',
        siewesFinal: score ? total / 2 : '—',
        status: !student.assignment
          ? 'Unassigned'
          : isComplete
            ? 'Completed'
            : score?.isDraft
              ? 'Draft Saved'
              : score
                ? 'Partially Scored'
                : 'Pending Score',
        submittedAt: score?.submittedAt
          ? new Date(score.submittedAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '—',
      });
    }

    scoresSheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
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

    // Sheet 2: Supervisor Progress Summary
    const summarySheet = workbook.addWorksheet(`Supervisor Summary`);
    summarySheet.columns = [
      { header: 'Supervisor Name', key: 'name', width: 30 },
      { header: 'Supervisor Email', key: 'email', width: 30 },
      { header: 'Assigned Students', key: 'assigned', width: 18 },
      { header: 'Scored Students', key: 'scored', width: 18 },
      { header: 'Pending', key: 'pending', width: 14 },
      { header: 'Completion (%)', key: 'completion', width: 16 },
    ];

    const summaryHeaderRow = summarySheet.getRow(1);
    summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summaryHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF374151' },
    };
    summaryHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    summaryHeaderRow.height = 26;

    for (const stat of Object.values(supervisorStats)) {
      const pending = stat.assigned - stat.scored;
      const rate =
        stat.assigned > 0
          ? Math.round((stat.scored / stat.assigned) * 100)
          : 0;
      summarySheet.addRow({
        name: stat.name,
        email: stat.email,
        assigned: stat.assigned,
        scored: stat.scored,
        pending,
        completion: `${rate}%`,
      });
    }

    summarySheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
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
}
