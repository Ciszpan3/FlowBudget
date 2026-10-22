import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError)
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Sprawdź wprowadzone dane.',
        details: error.issues,
      },
    });
  if (error instanceof Error && error.message === 'NOT_FOUND')
    return res
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'Nie znaleziono zasobu.' } });
  console.error(error instanceof Error ? error.message : 'Nieznany błąd');
  return res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Wystąpił nieoczekiwany błąd.' } });
};
