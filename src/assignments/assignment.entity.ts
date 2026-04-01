import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Student } from '../students/student.entity';
import { User } from '../users/user.entity';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Student, (student) => student.assignment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ unique: true })
  studentId: string;

  @ManyToOne(() => User, (user) => user.assignments, { eager: false })
  @JoinColumn({ name: 'supervisorId' })
  supervisor: User;

  @Column()
  supervisorId: string;

  @CreateDateColumn()
  assignedAt: Date;
}
