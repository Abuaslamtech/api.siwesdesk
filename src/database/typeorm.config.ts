import { DataSourceOptions } from 'typeorm';
import { User } from '../users/user.entity';
import { Session } from '../sessions/session.entity';
import { Student } from '../students/student.entity';
import { Assignment } from '../assignments/assignment.entity';
import { Score } from '../scores/score.entity';

export function buildTypeOrmOptions(
  databaseUrl: string,
  nodeEnv = 'development',
): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl,
    ssl: { rejectUnauthorized: false },
    entities: [User, Session, Student, Assignment, Score],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: nodeEnv === 'development',
    logging: nodeEnv === 'development',
  };
}
