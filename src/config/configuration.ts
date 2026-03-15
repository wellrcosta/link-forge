export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  rateLimit: {
    global: {
      max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX, 10) || 1000,
      ttl: parseInt(process.env.RATE_LIMIT_GLOBAL_TTL, 10) || 60,
    },
    ip: {
      max: parseInt(process.env.RATE_LIMIT_IP_MAX, 10) || 120,
      ttl: parseInt(process.env.RATE_LIMIT_IP_TTL, 10) || 60,
    },
    user: {
      max: parseInt(process.env.RATE_LIMIT_USER_MAX, 10) || 30,
      ttl: parseInt(process.env.RATE_LIMIT_USER_TTL, 10) || 60,
    },
    slug: {
      max: parseInt(process.env.RATE_LIMIT_SLUG_MAX, 10) || 500,
      ttl: parseInt(process.env.RATE_LIMIT_SLUG_TTL, 10) || 60,
    },
  },
});
