import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.config';

config();

export default new DataSource(
  buildTypeOrmOptions(
    process.env.DATABASE_URL || '',
    process.env.NODE_ENV || 'development',
  ),
);
