import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.config';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

config();

// Use WebSocket (port 443/WSS) instead of raw TCP (port 5432).
// Force IPv4 (family: 4) to avoid timeouts on networks where IPv6 is unreachable.
class CustomWebSocket extends ws {
  constructor(url: any, protocols: any, options: any) {
    super(url, protocols, { ...options, family: 4 });
  }
}
neonConfig.webSocketConstructor = CustomWebSocket as any;

export default new DataSource({
  ...buildTypeOrmOptions(
    process.env.DATABASE_URL || '',
    process.env.NODE_ENV || 'development',
  ),
  // Override the default 'pg' driver with Neon's WebSocket-compatible driver
  driver: require('@neondatabase/serverless'),
});
