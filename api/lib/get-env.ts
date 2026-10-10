type ApiEnvMode = "dev" | "prod";

export function getEnv(mode: ApiEnvMode = getApiEnvMode()) {
  return mode === "prod" ? getProdEnv() : getDevEnv();
}

function getDevEnv() {
  return {
    mode: "dev" as const,
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

function getProdEnv() {
  return {
    mode: "prod" as const,
    port: requiredNumberEnv("PROD_SERVER_PORT"),
    frontendUrl: requiredEnv("PROD_FRONTEND_URL"),
    databaseUrl: requiredEnv("PROD_DATABASE_URL"),
    jwtSecret: requiredEnv("PROD_JWT_SECRET"),
    googleClientId: requiredEnv("PROD_GOOGLE_CLIENT_ID"),
    googleClientSecret: requiredEnv("PROD_GOOGLE_CLIENT_SECRET"),
    googleCallbackUrl: requiredEnv("PROD_GOOGLE_CALLBACK_URL"),
    s3Bucket: requiredEnv("PROD_R2_BUCKET_NAME"),
    s3Region: requiredEnv("PROD_R2_REGION"),
    s3AccountId: requiredEnv("PROD_R2_ACCOUNT_ID"),
    s3AccessKeyId: requiredEnv("PROD_R2_ACCESS_KEY_ID"),
    s3SecretAccessKey: requiredEnv("PROD_R2_SECRET_ACCESS_KEY"),
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
