import { PostHog } from 'posthog-node';

export const posthog = new PostHog(
  process.env.POSTHOG_API_KEY || 'mock-posthog-key',
  { host: process.env.POSTHOG_HOST || 'https://app.posthog.com' }
);
