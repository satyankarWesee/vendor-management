import * as dotEnv from 'dotenv';

if (process.env.NODE_ENV !== 'prod') {
  const configFile = `./.env.${process.env.NODE_ENV}`;
  dotEnv.config({ path: configFile });
} else {
  dotEnv.config();
}

export const PORT = process.env.PORT || 3000;
export const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/testdb';
export const JWT_SECRET = process.env.JWT_SECRET || 'secret';
export const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'wesee';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Wesee@123';
