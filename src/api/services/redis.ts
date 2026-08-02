import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true // Prevent crashing if Redis is not running in dev environment
});

redis.on('error', (err) => {
  console.warn('[Redis] Connection warning (expected in serverless/dev if local Redis absent):', err.message);
});
