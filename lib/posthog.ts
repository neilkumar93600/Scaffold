import { PostHog } from 'posthog-node'

/**
 * Create a server-side PostHog client.
 * Call shutdown() after sending events in serverless functions.
 *
 * Usage:
 *   const ph = getPostHogClient()
 *   await ph.capture({ distinctId: userId, event: 'stack_created', properties: { stackId } })
 *   await ph.shutdown()
 */
export function getPostHogClient(): PostHog {
  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    // flushAt: 1 + flushInterval: 0 ensures events are sent immediately in serverless
    flushAt: 1,
    flushInterval: 0,
  })
}
