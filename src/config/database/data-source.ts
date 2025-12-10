
import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';
import { DataSourceOptions, DataSource } from 'typeorm';

// Cargar .env para el CLI de TypeORM
dotenvConfig({ 
  path: join(__dirname, `../../env/.env.${process.env.NODE_ENV || 'local'}`) 
});

export const dataSourceOptions: DataSourceOptions = {
  type: process.env.DB_TYPE as 'postgres' | 'mysql' | 'mariadb',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  
  migrations: [join(__dirname, './migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : false,
  
  synchronize: false, // SIEMPRE false para migraciones
  logging: process.env.DB_LOGGING === 'true',
};

// DataSource para el CLI
const dataSource = new DataSource(dataSourceOptions);

export default dataSource;