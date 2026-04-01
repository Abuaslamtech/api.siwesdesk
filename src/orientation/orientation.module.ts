import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrientationController } from './orientation.controller';
import { OrientationService } from './orientation.service';
import { Score } from '../scores/score.entity';
import { Student } from '../students/student.entity';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Score, Student]), SessionsModule],
  controllers: [OrientationController],
  providers: [OrientationService],
})
export class OrientationModule {}
