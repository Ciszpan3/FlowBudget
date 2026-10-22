import { loadEnvFile } from 'node:process';
import { z } from 'zod';

if (!process.env.DATABASE_URL) {
  try {
    loadEnvFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.url().default('http://localhost:5173'),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
});

export const env = schema.parse(process.env);
