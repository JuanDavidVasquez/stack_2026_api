import { Config } from './config.interface';
import { Env } from './env.schema';


export default (): Config => ({
  environment: process.env.NODE_ENV || 'local',
  port: parseInt(process.env.PORT || '', 10) || 3000,
  
  database: {
    type: process.env.DB_TYPE as 'postgres' | 'mysql' | 'mariadb',
    host: process.env.DB_HOST || '',
    port: parseInt(process.env.DB_PORT || '', 10),
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || '',
    ssl: process.env.DB_SSL === 'true',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
  
  mongodb: {
    uri: process.env.MONGODB_URI,
    database: process.env.MONGODB_DATABASE,
    useNewUrlParser: process.env.MONGODB_USE_NEW_URL_PARSER === 'true',
    useUnifiedTopology: process.env.MONGODB_USE_UNIFIED_TOPOLOGY === 'true',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '', 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '', 10) || 0,
    ttl: parseInt(process.env.REDIS_TTL || '', 10) || 3600,
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || ['http://localhost:3000'],
  },
  
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '', 10) || 60,
    max: parseInt(process.env.RATE_LIMIT_MAX || '', 10) || 10,
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '', 10) || 5242880,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  smtp: process.env.SMTP_HOST ? {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  } : undefined,

  crypto: {
    secretKey: process.env.CRYPTO_SECRET_KEY || '',
    algorithm: process.env.CRYPTO_ALGORITHM || 'aes-256-gcm',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  
  urls:{
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
    api: process.env.API_URL || 'http://localhost:3000/api',
  }
});