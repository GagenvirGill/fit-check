type ApiEnvMode = "dev" | "prod";

// .env.dev and .env.prod use the same plain names. API_ENV only switches
// prod behaviour (such as secure cookies), not which variables are read.
export function getEnv() {
  return {
    mode: getApiEnvMode(),
    host: requiredEnv("SERVER_HOST"),
    port: requiredNumberEnv("SERVER_PORT"),
    frontendUrl: requiredEnv("FRONTEND_URL"),
    databaseUrl: requiredEnv("DATABASE_URL"),
    jwtSecret: requiredEnv("JWT_SECRET"),
    googleClientId: requiredEnv("GOOGLE_CLIENT_ID"),
    googleClientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    googleCallbackUrl: requiredEnv("GOOGLE_CALLBACK_URL"),
    s3Bucket: requiredEnv("R2_BUCKET_NAME"),
    s3Region: requiredEnv("R2_REGION"),
    s3AccountId: requiredEnv("R2_ACCOUNT_ID"),
    s3AccessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
    s3SecretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
  };
}

export type Env = ReturnType<typeof getEnv>;

export const env = getEnv();

function getApiEnvMode(): ApiEnvMode {
  const value = process.env.API_ENV;
  if (value === "dev") {
    return "dev";
  }
  if (value === "prod") {
    return "prod";
  }

  throw new Error('API_ENV must be "dev" or "prod"');
}

function requiredEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function requiredNumberEnv(key: string): number {
  const value = requiredEnv(key);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return parsed;
}
