import { DataSource } from 'typeorm';
import { User } from './src/users/user.entity';
import { Assignment } from './src/assignments/assignment.entity';
import { Score } from './src/scores/score.entity';
import { config } from 'dotenv';
config();

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [User, Assignment, Score],
});

async function run() {
  await ds.initialize();
  const repo = ds.getRepository(User);
  const user = await repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email: 'director@alhikmah.edu.ng' })
      .getOne();
  console.log('User passwordHash:', user?.passwordHash);
  process.exit(0);
}

run().catch(console.error);
