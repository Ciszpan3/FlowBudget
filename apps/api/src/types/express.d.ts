import type { SessionUser } from '@flowbudget/shared';

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      sessionId?: string;
      csrfToken?: string;
    }
  }
}
export {};
