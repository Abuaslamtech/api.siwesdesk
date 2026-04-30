import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.config';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

config();

// Use WebSocket (port 443/WSS) instead of raw TCP (port 5432).
// This permanently fixes ECONNRESET/ETIMEDOUT errors caused by ISPs
// blocking the PostgreSQL protocol handshake on port 5432.
neonConfig.webSocketConstructor = ws;

export default new DataSource({
  ...buildTypeOrmOptions(
    process.env.DATABASE_URL || '',
    process.env.NODE_ENV || 'development',
  ),
  // Override the default 'pg' driver with Neon's WebSocket-compatible driver
  driver: require('@neondatabase/serverless'),
});
