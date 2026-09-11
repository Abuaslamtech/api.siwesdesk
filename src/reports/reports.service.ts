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

  /**
   * Applies consistent, executive-level styling to a worksheet:
   * - Crisp Segoe UI typography
   * - Modern Dark Slate header (#1E293B) with subtle slate borders
   * - Freeze pane on header row
   * - AutoFilter across all columns
   * - Alternating zebra rows (Slate-50 / White)
   * - Soft Slate borders (#E2E8F0)
   * - Centered alignment for codes, dates, numbers, and status badges
   */
  private applySheetStyling(
    sheet: ExcelJS.Worksheet,
    options: {
      headerRowIndex?: number;
      headerBgColor?: string;
      freezeRow?: number;
      centerColumnKeys?: string[];
      centerColIndices?: number[];
    } = {},
  ) {
    const headerRowIndex = options.headerRowIndex ?? 1;
    const headerBgColor = options.headerBgColor ?? 'FF1E293B'; // Executive Slate-800
    const freezeRow = options.freezeRow ?? headerRowIndex;
    const centerKeys = new Set(options.centerColumnKeys ?? []);
    const totalCols =
      sheet.columns?.length || sheet.getRow(headerRowIndex).cellCount || 1;

    // 1. Freeze pane with gridlines visible
    sheet.views = [
      {
        state: 'frozen',
        ySplit: freezeRow,
        showGridLines: true,
      },
    ];

    // 2. Enable AutoFilter on header row
    if (totalCols > 0) {
      sheet.autoFilter = {
        from: { row: headerRowIndex, column: 1 },
        to: { row: headerRowIndex, column: totalCols },
      };
    }

    // 3. Style Header Row
    const headerRow = sheet.getRow(headerRowIndex);
    headerRow.height = 28;
    for (let c = 1; c <= totalCols; c++) {
      const cell = headerRow.getCell(c);
      cell.font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: headerBgColor },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: false,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    }

    // Identify which column indices should be centered
    const centeredIndices = new Set<number>(options.centerColIndices ?? []);
    if (sheet.columns) {
      sheet.columns.forEach((col, idx) => {
        if (col.key && centerKeys.has(col.key)) {
          centeredIndices.add(idx + 1);
        }
      });
    }

    // 4. Style Data Rows
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;
      row.height = 22;
      const isEven = (rowNumber - headerRowIndex) % 2 === 0;
      const rowBg = isEven ? 'FFF8FAFC' : 'FFFFFFFF'; // Slate-50 alternating with White

      for (let c = 1; c <= totalCols; c++) {
        const cell = row.getCell(c);
        cell.font = {
          name: 'Segoe UI',
          size: 9.5,
          color: { argb: 'FF0F172A' },
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowBg },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: centeredIndices.has(c) ? 'center' : 'left',
        };
      }
    });
  }

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
      { header: 'Matric No', key: 'matricNo', width: 20 },
      { header: 'Student Name', key: 'name', width: 30 },
      { header: 'Department', key: 'department', width: 24 },
      { header: 'Course', key: 'course', width: 24 },
      { header: 'Level', key: 'level', width: 12 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'WhatsApp', key: 'whatsappNumber', width: 18 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'State', key: 'state', width: 16 },
      { header: 'LGA / Area', key: 'lga', width: 22 },
      { header: 'Industry Placement', key: 'industry', width: 32 },
      { header: 'Placement Address', key: 'address', width: 34 },
      { header: 'Duration', key: 'siwesDuration', width: 18 },
      { header: 'Industry Supervisor', key: 'industrySupervisorName', width: 28 },
      { header: 'Industry Sup. Phone', key: 'industrySupervisorPhone', width: 22 },
      { header: 'Bank Name', key: 'bankName', width: 22 },
      { header: 'Account Name', key: 'accountName', width: 26 },
      { header: 'Account Number', key: 'accountNumber', width: 20 },
      { header: 'Sort Code', key: 'sortCode', width: 14 },
      { header: 'Institutional Supervisor', key: 'supervisor', width: 28 },
      { header: 'Orientation /10', key: 'orientation', width: 18 },
      { header: 'Supervisor /40', key: 'supervisorScore', width: 18 },
      { header: 'Industry /50', key: 'industryScore', width: 16 },
      { header: 'Total /100', key: 'total', width: 14 },
      { header: 'SIWES Score /50', key: 'siewesFinal', width: 18 },
      { header: 'Status', key: 'status', width: 16 },
    ];

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
        name: student.name,
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
          student.score?.orientation !== null &&
          student.score?.orientation !== undefined
            ? student.score.orientation
            : '—',
        supervisorScore:
          student.score?.supervisorScore !== null &&
          student.score?.supervisorScore !== undefined
            ? student.score.supervisorScore
            : '—',
        industryScore:
          student.score?.industryScore !== null &&
          student.score?.industryScore !== undefined
            ? student.score.industryScore
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

    this.applySheetStyling(sheet, {
      headerBgColor: 'FF1E293B',
      centerColumnKeys: [
        'matricNo',
        'level',
        'phone',
        'whatsappNumber',
        'accountNumber',
        'sortCode',
        'state',
        'siwesDuration',
        'orientation',
        'supervisorScore',
        'industryScore',
        'total',
        'siewesFinal',
        'status',
      ],
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
        { width: 20 },
        { width: 22 },
        { width: 26 },
        { width: 20 },
        ...(includeIncomplete ? [{ width: 18 }] : []),
      ];

      const titleRow = sheet.addRow([`SIWES ${session.year} - ${department}`]);
      titleRow.font = {
        name: 'Segoe UI',
        bold: true,
        size: 12,
        color: { argb: 'FF1E293B' },
      };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 32;
      sheet.mergeCells(1, 1, 1, headers.length);
      titleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' }, // Slate-100 banner
      };
      titleRow.getCell(1).border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      sheet.addRow(headers);

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

      this.applySheetStyling(sheet, {
        headerRowIndex: 2,
        freezeRow: 2,
        headerBgColor: 'FF1E293B',
        centerColIndices: [1, 4, 5],
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

    // Matches the 19 official SIWES template columns + assigned supervisor metadata
    sheet.columns = [
      { header: 'Email Address', key: 'email', width: 30 },
      { header: 'Name in Full (Surname in Capital Letter)', key: 'name', width: 40 },
      { header: 'Matric. Number', key: 'matricNo', width: 20 },
      { header: 'Level', key: 'level', width: 12 },
      { header: 'Programme of Study', key: 'course', width: 28 },
      { header: 'Faculty', key: 'faculty', width: 26 },
      { header: 'WhatsApp Number Only', key: 'whatsappNumber', width: 24 },
      { header: 'Phone Number', key: 'phone', width: 20 },
      { header: 'Bank Name', key: 'bankName', width: 22 },
      { header: 'Account Name', key: 'accountName', width: 28 },
      { header: 'Account Number', key: 'accountNumber', width: 20 },
      { header: 'Sort Code', key: 'sortCode', width: 14 },
      { header: 'SIWES Placement', key: 'industry', width: 34 },
      { header: 'Address SIWES placement', key: 'address', width: 36 },
      { header: 'Area/Local Government/Town/', key: 'lga', width: 28 },
      { header: 'State', key: 'state', width: 18 },
      { header: 'Industry-based Supervisor Name', key: 'industrySupervisorName', width: 32 },
      { header: 'Industry-based Supervisor Phone Number', key: 'industrySupervisorPhone', width: 32 },
      { header: 'Duration of SIWES Exercise', key: 'siwesDuration', width: 24 },
      { header: 'Assigned Institutional Supervisor', key: 'supervisor', width: 32 },
      { header: 'Assignment Status', key: 'status', width: 18 },
    ];

    for (const student of students) {
      // Ensure surname is capitalized as required by template
      const formattedName =
        student.surname && student.otherNames
          ? `${student.surname.toUpperCase()} ${student.otherNames}`
          : student.name;

      sheet.addRow({
        email: student.email ?? '—',
        name: formattedName,
        matricNo: student.matricNo,
        level: student.level,
        course: student.course ?? student.department ?? '—',
        faculty: student.faculty ?? '—',
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

    this.applySheetStyling(sheet, {
      headerBgColor: 'FF1E293B',
      centerColumnKeys: [
        'matricNo',
        'level',
        'whatsappNumber',
        'phone',
        'accountNumber',
        'sortCode',
        'state',
        'siwesDuration',
        'status',
      ],
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
    const scoresSheet = workbook.addWorksheet(`Supervisor Scores`);

    scoresSheet.columns = [
      { header: 'Matric No', key: 'matricNo', width: 20 },
      { header: 'Student Name', key: 'name', width: 32 },
      { header: 'Faculty', key: 'faculty', width: 26 },
      { header: 'Course / Department', key: 'course', width: 28 },
      { header: 'Level', key: 'level', width: 12 },
      { header: 'Placement Establishment', key: 'industry', width: 32 },
      { header: 'State', key: 'state', width: 16 },
      { header: 'Assigned Supervisor', key: 'supervisor', width: 30 },
      { header: 'Supervisor Email', key: 'supervisorEmail', width: 30 },
      { header: 'Orientation /10', key: 'orientation', width: 18 },
      { header: 'Supervisor Score /40', key: 'supervisorScore', width: 22 },
      { header: 'Industry Score /50', key: 'industryScore', width: 20 },
      { header: 'Total Score /100', key: 'total', width: 18 },
      { header: 'SIWES Final /50', key: 'siewesFinal', width: 18 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Submitted At', key: 'submittedAt', width: 20 },
    ];

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
          score?.supervisorScore !== null &&
          score?.supervisorScore !== undefined
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

    this.applySheetStyling(scoresSheet, {
      headerBgColor: 'FF1E293B',
      centerColumnKeys: [
        'matricNo',
        'level',
        'state',
        'orientation',
        'supervisorScore',
        'industryScore',
        'total',
        'siewesFinal',
        'status',
        'submittedAt',
      ],
    });

    // Sheet 2: Supervisor Progress Summary
    const summarySheet = workbook.addWorksheet(`Supervisor Summary`);
    summarySheet.columns = [
      { header: 'Supervisor Name', key: 'name', width: 32 },
      { header: 'Supervisor Email', key: 'email', width: 32 },
      { header: 'Assigned Students', key: 'assigned', width: 20 },
      { header: 'Scored Students', key: 'scored', width: 20 },
      { header: 'Pending', key: 'pending', width: 16 },
      { header: 'Completion Rate', key: 'completion', width: 18 },
    ];

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

    this.applySheetStyling(summarySheet, {
      headerBgColor: 'FF1E293B',
      centerColumnKeys: ['assigned', 'scored', 'pending', 'completion'],
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
