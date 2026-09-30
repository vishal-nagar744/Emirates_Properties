export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/emirates_properties',
  sessionTtlMs: 12 * 60 * 60 * 1000,
  rememberTtlMs: 7 * 24 * 60 * 60 * 1000,
};
