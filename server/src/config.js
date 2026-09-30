import dotenv from 'dotenv';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(serverRoot, '.env') });

function text(name, fallback = '') {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') return fallback;
  return value.trim();
}

function positiveInt(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const port = positiveInt('PORT', 4000);

export const config = {
  port,
  mongoUri: text('MONGODB_URI', 'mongodb://127.0.0.1:27017/emirates_properties'),
  publicApiUrl: text('PUBLIC_API_URL', `http://127.0.0.1:${port}`).replace(/\/$/, ''),
  corsOrigins: text('CORS_ORIGINS', 'http://127.0.0.1:5500,http://localhost:5500')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  allowLocalhostCors: text('ALLOW_LOCALHOST_CORS', 'true') !== 'false',
  sessionTtlMs: positiveInt('SESSION_TTL_HOURS', 12) * 60 * 60 * 1000,
  rememberTtlMs: positiveInt('REMEMBER_TTL_DAYS', 7) * 24 * 60 * 60 * 1000,
  uploadDir: text('UPLOAD_DIR', path.join(os.homedir(), '.emirates-properties', 'uploads')),
  admin: {
    loginId: text('ADMIN_LOGIN_ID', 'admin'),
    password: text('ADMIN_PASSWORD'),
    name: text('ADMIN_NAME', 'Emirates Admin'),
    mobile: text('ADMIN_MOBILE', '+971 4 000 0001'),
  },
};
