import { Response } from 'express';

let counter = 0;

export function errorId(): string {
  counter += 1;
  return `ERR-${Date.now().toString(36)}-${counter}`;
}

export function sendError(res: Response, status: number, message: string, details?: any): void {
  const id = errorId();
  console.error(`[${id}] ${message}`, details || '');
  res.status(status).json({ error: message, errorId: id });
}
