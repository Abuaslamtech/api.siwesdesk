import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Session } from '../sessions/session.entity';
import { Assignment } from '../assignments/assignment.entity';
import { Score } from '../scores/score.entity';

@Entity('students')
@Unique(['matricNo', 'sessionId'])
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Session, (session) => session.students, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column()
  sessionId: string;

  @Column()
  matricNo: string;

  @Column()
  surname: string;

  @Column()
  otherNames: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  department: string | null;

  @Column({ type: 'varchar', nullable: true })
  faculty: string | null;

  @Column({ type: 'varchar', nullable: true })
  course: string | null;

  @Column()
  level: string;

  @Column()
  state: string;

  @Column({ type: 'varchar', nullable: true })
  lga: string | null;

  @Column({ type: 'varchar', nullable: true })
  industry: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  gender: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Assignment, (assignment) => assignment.student)
  assignment: Assignment;

  @OneToOne(() => Score, (score) => score.student)
  score: Score;
}
