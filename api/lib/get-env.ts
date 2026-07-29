export type Env = {
  frontendUrl: string;
  apiUrl: string;
  databaseUrl: string;
  jwtSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  s3Bucket: string;
  s3Region: string;
};

export function getEnv(): Env {
  return {
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
    apiUrl: process.env.API_URL ?? "http://localhost:3000",
    databaseUrl: requiredEnv("DATABASE_URL"),
    jwtSecret: process.env.JWT_SECRET ?? "development-jwt-secret",
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    s3Bucket: requiredEnv("S3_BUCKET"),
    s3Region: process.env.S3_REGION ?? "us-east-1",
  };
}

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}
