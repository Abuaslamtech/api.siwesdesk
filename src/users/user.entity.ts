import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { Assignment } from '../assignments/assignment.entity';
import { Score } from '../scores/score.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Assignment, (assignment) => assignment.supervisor)
  assignments: Assignment[];

  @OneToMany(() => Score, (score) => score.enteredBy)
  scores: Score[];
}
