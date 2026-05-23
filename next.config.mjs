import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sentry source map uploads require build-time access to SENTRY_AUTH_TOKEN
  // Set this in Vercel environment variables (not in this file)
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? 'scaffold',
  // Suppress Sentry CLI output unless running in CI
  silent: !process.env.CI,
  webpack: {
    // Disable automatic Vercel Crons monitoring
    automaticVercelMonitors: false,
  },
})
