export const applyTestEnv = () => {
  Object.assign(process.env, {
    DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
    FRONTEND_URL: 'http://localhost:5173',
    BACKEND_URL: 'http://localhost:4000',
    JWT_SECRET: 'test-jwt-secret',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:4000/auth/google/callback',
    R2_ACCESS_KEY_ID: 'r2-access-key',
    R2_SECRET_ACCESS_KEY: 'r2-secret-key',
    R2_BUCKET_NAME: 'r2-bucket',
    R2_ACCOUNT_ID: 'r2-account',
    R2_REGION: 'auto',
    R2_URL: 'https://cdn.example.com',
  });
};
