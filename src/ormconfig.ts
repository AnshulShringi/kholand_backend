import './LoadEnv'; 
import { ConnectionOptions } from 'typeorm';

const herokuConfig =   {
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
}
const databaseUrl: string = process.env.DATABASE_URL!;
let sslConfig = {};

const env = process.env.NODE_ENV?.toLowerCase();
switch(env){
  case 'production':
  case 'heroku':
    sslConfig = herokuConfig;
    break;
  case 'development':
    sslConfig = herokuConfig;
    break;
  default:
    sslConfig = {};
}


const config: ConnectionOptions = {
  name: 'default',
  type: 'postgres',
  url: databaseUrl, 
  ...sslConfig,
  entities: [
    __dirname + '/components/**/model{.ts,.js}',
  ],
  migrations: [
    __dirname + '/migrations/*{.ts,.js}',
  ],
  cli: {
    migrationsDir: __dirname + '/migrations',
  }
};
 
export = config;