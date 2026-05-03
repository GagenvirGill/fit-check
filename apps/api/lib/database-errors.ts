type DatabaseErrorLike = {
  code?: unknown;
};

export const isDatabaseUniqueViolation = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return (error as DatabaseErrorLike).code === '23505';
};
