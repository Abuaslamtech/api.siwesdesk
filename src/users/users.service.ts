import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.repo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const saved = await this.repo.save(
      this.repo.create({
        name: dto.name.trim(),
        email: dto.email.toLowerCase(),
        passwordHash: await bcrypt.hash(dto.password, 12),
        role: dto.role,
      }),
    );

    return this.findById(saved.id);
  }

  async findAll(role?: Role): Promise<User[]> {
    return this.repo.find({
      where: role ? { role } : {},
      order: { name: 'ASC' },
    });
  }

  async findSupervisors(): Promise<User[]> {
    return this.findAll(Role.SUPERVISOR);
  }

  async findOptionalById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.findOptionalById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.repo.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.repo.findOne({
        where: { email: dto.email.toLowerCase() },
      });

      if (existing && existing.id !== user.id) {
        throw new ConflictException('Email already in use');
      }

      user.email = dto.email.toLowerCase();
    }

    if (dto.name) {
      user.name = dto.name.trim();
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    await this.repo.save(user);

    return this.findById(id);
  }
}
