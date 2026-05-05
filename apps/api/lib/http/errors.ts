export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export const httpError = (statusCode: number, message: string) => new HttpError(statusCode, message);

export const badRequest = (message: string) => httpError(400, message);
export const unauthorized = (message = 'Unauthorized') => httpError(401, message);
export const notFound = (message: string) => httpError(404, message);
export const conflict = (message: string) => httpError(409, message);

export const getHttpStatusCode = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const statusCode = (error as { statusCode?: unknown }).statusCode;
  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 600) {
    return statusCode;
  }

  return null;
};

export const getErrorMessage = (error: unknown, fallback = 'Unknown error'): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
