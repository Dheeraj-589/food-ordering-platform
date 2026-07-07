export default () => ({
  environment: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL,
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION_TIME || '1d',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || 'refresh-super-secret-key-pizza-hut',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME || '7d',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'no-reply@foodplatform.com',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
});
