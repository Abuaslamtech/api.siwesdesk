import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import { StudentsModule } from './students/students.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { OrientationModule } from './orientation/orientation.module';
import { ScoresModule } from './scores/scores.module';
import { ReportsModule } from './reports/reports.module';
import { HealthModule } from './health/health.module';
import { User } from './users/user.entity';
import { Session } from './sessions/session.entity';
import { Student } from './students/student.entity';
import { Assignment } from './assignments/assignment.entity';
import { Score } from './scores/score.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>('NODE_ENV');

        return {
          type: 'postgres' as const,
          url: config.getOrThrow<string>('DATABASE_URL'),
          ssl: { rejectUnauthorized: false },
          entities: [User, Session, Student, Assignment, Score],
          synchronize: nodeEnv === 'development',
          migrationsRun: false,
          migrations: ['dist/database/migrations/*.js'],
          logging: nodeEnv === 'development',
        };
      },
    }),
    AuthModule,
    UsersModule,
    SessionsModule,
    StudentsModule,
    AssignmentsModule,
    OrientationModule,
    ScoresModule,
    ReportsModule,
    HealthModule,
  ],
})
export class AppModule {}
