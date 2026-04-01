import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../students/student.entity';
import { User } from '../users/user.entity';

@Entity('scores')
export class Score {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Student, (student) => student.score, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ unique: true })
  studentId: string;

  @Column({ type: 'int', nullable: true, default: null })
  orientation: number | null;

  @Column({ type: 'int', nullable: true, default: null })
  supervisorScore: number | null;

  @Column({ type: 'int', nullable: true, default: null })
  industryScore: number | null;

  @ManyToOne(() => User, (user) => user.scores, { nullable: true })
  @JoinColumn({ name: 'enteredById' })
  enteredBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  enteredById: string | null;

  @Column({ default: false })
  isDraft: boolean;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
