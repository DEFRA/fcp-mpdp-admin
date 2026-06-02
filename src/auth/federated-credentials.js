import { STSClient, GetWebIdentityTokenCommand } from '@aws-sdk/client-sts'
import { buildRedisClient } from '../common/helpers/redis-client.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { config } from '../config/config.js'

const logger = createLogger()

// AWS STS tokens are short-lived (≤ 900s). We cache the token in Redis (shared
// across all instances) and also in memory (required for Bell's synchronous
// tokenParams callback). On startup, we warm the in-memory cache from Redis if a
// fresh token is already present, avoiding an unnecessary STS call.

const REDIS_TOKEN_KEY = 'federated-credentials-token'
// Refresh 2 minutes before expiry — appropriate for tokens ≤ 850s
const REFRESH_BUFFER_MS = 2 * 60 * 1000

let cachedToken = null
let refreshTimer = null
let redisClient = null

function getRedisClient () {
  if (!redisClient) {
    redisClient = buildRedisClient(config.get('redis'))
  }
  return redisClient
}

async function getFederatedToken () {
  const client = new STSClient()

  const command = new GetWebIdentityTokenCommand({
    Audience: [config.get('federatedCredentials.audience')],
    DurationSeconds: config.get('federatedCredentials.tokenDurationSeconds')
  })

  const result = await client.send(command)
  return result
}

async function refreshCachedToken () {
  try {
    logger.info('Refreshing AWS STS federated identity token')
    const result = await getFederatedToken()

    const durationMs = config.get('federatedCredentials.tokenDurationSeconds') * 1000
    const expiresAt = Date.now() + durationMs
    const nextRefreshMs = Math.max(durationMs - REFRESH_BUFFER_MS, 30000)

    cachedToken = result.IdentityToken

    // Write to Redis so other instances and restarts can warm from cache.
    // TTL is set to tokenDurationSeconds so Redis auto-expires the key.
    await getRedisClient().set(
      REDIS_TOKEN_KEY,
      JSON.stringify({ token: result.IdentityToken, expiresAt }),
      'EX',
      config.get('federatedCredentials.tokenDurationSeconds')
    )

    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }
    refreshTimer = setTimeout(refreshCachedToken, nextRefreshMs)
    logger.info(`Federated identity token cached, next refresh in ${Math.round(nextRefreshMs / 60000)} minutes`)
  } catch (err) {
    logger.error(err, 'Failed to refresh AWS STS federated identity token')
    // Retry after 30 seconds on failure; do not clear cachedToken so in-flight
    // requests can still use the (possibly expiring) previous token.
    refreshTimer = setTimeout(refreshCachedToken, 30000)
  }
}

async function initFederatedTokenCache () {
  // Propagates on Redis failure — server should not start without a working cache.
  const raw = await getRedisClient().get(REDIS_TOKEN_KEY)

  if (raw) {
    const { token, expiresAt } = JSON.parse(raw)
    const remainingMs = expiresAt - Date.now()

    if (remainingMs > REFRESH_BUFFER_MS) {
      logger.info('Loaded federated identity token from Redis cache')
      cachedToken = token
      // Schedule refresh for when the remaining TTL reaches the buffer threshold
      const nextRefreshMs = Math.max(remainingMs - REFRESH_BUFFER_MS, 30000)
      refreshTimer = setTimeout(refreshCachedToken, nextRefreshMs)
      return
    }
  }

  // No token in Redis, or token is too close to expiry — fetch a fresh one.
  await refreshCachedToken()
}

function getCachedFederatedToken () {
  // Safety net: if the refresh timer was somehow cleared (e.g. unhandled exception
  // in a previous refresh), fire a background refresh so the next request is covered.
  if (!refreshTimer && cachedToken) {
    refreshCachedToken().catch((err) => logger.error(err, 'Background federated token refresh failed'))
  }
  return cachedToken
}

export { getFederatedToken, initFederatedTokenCache, getCachedFederatedToken }
