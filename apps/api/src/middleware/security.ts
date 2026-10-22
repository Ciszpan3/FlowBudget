import { createHash, randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const SESSION_COOKIE = 'flowbudget_session';
export const newToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const raw = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!raw)
    return res
      .status(401)
      .json({ error: { code: 'UNAUTHENTICATED', message: 'Zaloguj się, aby kontynuować.' } });
  const session = await prisma.session.findUnique({
    where: { id: hashToken(raw) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) {
    res.clearCookie(SESSION_COOKIE);
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Sesja wygasła.' } });
  }
  req.sessionId = session.id;
  req.csrfToken = session.csrfToken;
  req.user = { id: session.user.id, name: session.user.name, email: session.user.email };
  next();
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-csrf-token') !== req.csrfToken)
    return res
      .status(403)
      .json({ error: { code: 'CSRF_INVALID', message: 'Żądanie wygasło. Odśwież stronę.' } });
  next();
}
