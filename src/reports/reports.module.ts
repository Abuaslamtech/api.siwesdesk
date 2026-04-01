import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Student } from '../students/student.entity';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Student]), SessionsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
