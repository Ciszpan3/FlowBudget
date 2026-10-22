import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
const server = app.listen(env.PORT, () =>
  console.log(`FlowBudget API działa na porcie ${env.PORT}`),
);
const shutdown = () => server.close(() => void prisma.$disconnect().finally(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
