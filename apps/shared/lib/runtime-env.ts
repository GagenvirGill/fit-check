export type AppRuntimeEnv = 'development' | 'production';

export const validateAppRuntimeEnv = (
  value: string,
): AppRuntimeEnv => {
  if (value !== 'development' && value !== 'production') {
    throw new Error('NODE_ENV must be either "development" or "production"');
  }

  return value;
};
