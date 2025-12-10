import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

// Configuración para usar en el módulo de NestJS
export default registerAs('typeorm', (): TypeOrmModuleOptions => ({
  type: process.env.DB_TYPE as 'postgres' | 'mysql' | 'mariadb',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  
  // Entities
  entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
  autoLoadEntities: true,
  
  // SSL
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : false,
  
  // Synchronize (solo desarrollo)
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  
  // Logging
  logging: process.env.DB_LOGGING === 'true',
  logger: 'advanced-console',
  
  // Migrations
  migrations: [join(__dirname, '../../database/migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  migrationsRun: false,
  
  // Connection pool
  extra: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },
}));