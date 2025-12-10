
export interface Config {
  environment: string;
  port: number;
  
  database: {
    type: 'postgres' | 'mysql' | 'mariadb';
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
    synchronize: boolean;
    logging: boolean;
  };
  
  mongodb: {
    uri?: string;
    database?: string;
    useNewUrlParser: boolean;
    useUnifiedTopology: boolean;
  };
  
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
    ttl: number;
  };
  
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  
  cors: {
    allowedOrigins: string[];
  };
  
  rateLimit: {
    ttl: number;
    max: number;
  };
  
  upload: {
    maxFileSize: number;
  };
  
  logging: {
    level: string;
  };
  
  smtp?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    from?: string;
  };

    crypto: {
    secretKey: string;
    algorithm: string;
    bcryptRounds: number;
  };
}