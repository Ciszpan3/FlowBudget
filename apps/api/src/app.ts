import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/routes.js';
import { accountsRouter } from './modules/accounts/routes.js';
import { transactionsRouter } from './modules/transactions/routes.js';
import { budgetsRouter } from './modules/budgets/routes.js';
import { categoriesRouter } from './modules/categories/routes.js';
import { analyticsRouter } from './modules/analytics/routes.js';
import { importsRouter } from './modules/imports/routes.js';
import { authenticate, csrfProtection } from './middleware/security.js';
import { errorHandler } from './middleware/errors.js';
import { openapi } from './openapi.js';
export const app = express();
app.set('trust proxy', env.TRUST_PROXY === 'true');
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true,
    allowedHeaders: ['Content-Type', 'x-csrf-token'],
  }),
);
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());
app.use(
  rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false }),
);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/openapi.json', (_req, res) => res.json(openapi));
app.use('/api/auth', authRouter);
app.use('/api', authenticate, csrfProtection);
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/imports', importsRouter);
app.use((_req, res) =>
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Nie znaleziono endpointu.' } }),
);
app.use(errorHandler);
