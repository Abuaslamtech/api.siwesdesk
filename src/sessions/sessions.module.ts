import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { Session } from './session.entity';
import { Student } from '../students/student.entity';
import { Score } from '../scores/score.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Student, Score])],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
