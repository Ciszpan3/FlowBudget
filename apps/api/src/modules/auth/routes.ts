import { Router } from 'express';
import { hash, verify } from '@node-rs/argon2';
import { loginSchema, registerSchema } from '@flowbudget/shared';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import {
  authenticate,
  csrfProtection,
  hashToken,
  newToken,
  SESSION_COOKIE,
} from '../../middleware/security.js';

export const authRouter = Router();
const authLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
const cookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: env.SESSION_TTL_DAYS * 86_400_000,
});
const defaults = [
  ['Zakupy spożywcze', '#79b473', 'shopping-basket', false],
  ['Transport', '#63a4ff', 'car', false],
  ['Mieszkanie', '#b98cff', 'house', false],
  ['Subskrypcje', '#ff8a65', 'repeat', false],
  ['Zdrowie', '#ef6c85', 'heart-pulse', false],
  ['Wynagrodzenie', '#31b57b', 'wallet', true],
] as const;

async function createSession(userId: string) {
  const token = newToken();
  const csrfToken = newToken();
  await prisma.session.create({
    data: {
      id: hashToken(token),
      userId,
      csrfToken,
      expiresAt: new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000),
    },
  });
  return { token, csrfToken };
}

authRouter.post('/register', authLimit, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const exists = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (exists)
    return res.status(400).json({
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Nie udało się utworzyć konta. Sprawdź dane.',
      },
    });
  const password = await hash(input.password, {
    algorithm: 2,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  const user = await prisma.user.create({
    data: {
      ...input,
      password,
      categories: {
        create: defaults.map(([name, color, icon, isIncome]) => ({ name, color, icon, isIncome })),
      },
    },
  });
  const session = await createSession(user.id);
  res
    .cookie(SESSION_COOKIE, session.token, cookieOptions())
    .status(201)
    .json({
      user: { id: user.id, email: user.email, name: user.name },
      csrfToken: session.csrfToken,
    });
});

authRouter.post('/login', authLimit, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const ok = user ? await verify(user.password, input.password) : false;
  if (!user || !ok)
    return res
      .status(401)
      .json({ error: { code: 'INVALID_CREDENTIALS', message: 'Nieprawidłowy e-mail lub hasło.' } });
  const session = await createSession(user.id);
  res.cookie(SESSION_COOKIE, session.token, cookieOptions()).json({
    user: { id: user.id, email: user.email, name: user.name },
    csrfToken: session.csrfToken,
  });
});

authRouter.get('/session', authenticate, (req, res) =>
  res.json({ user: req.user, csrfToken: req.csrfToken }),
);
authRouter.post('/logout', authenticate, csrfProtection, async (req, res) => {
  await prisma.session.delete({ where: { id: req.sessionId! } }).catch(() => undefined);
  res.clearCookie(SESSION_COOKIE, { path: '/' }).status(204).end();
});
