export class DatabaseQueryError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'DatabaseQueryError';
    this.statusCode = statusCode;
  }
}

export const isDatabaseQueryError = (error: unknown): error is DatabaseQueryError =>
  error instanceof DatabaseQueryError;
