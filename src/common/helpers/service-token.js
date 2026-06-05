import { STSClient, GetWebIdentityTokenCommand } from '@aws-sdk/client-sts'
import { createLogger } from './logging/logger.js'
import { config } from '../../config/config.js'

const logger = createLogger()

const REFRESH_BUFFER_MS = 2 * 60 * 1000

let cachedToken = null
let refreshTimer = null

async function fetchToken () {
  const audience = config.get('serviceAuth.audience')
  const tokenDurationSeconds = config.get('serviceAuth.tokenDurationSeconds')

  const client = new STSClient()
  const command = new GetWebIdentityTokenCommand({
    Audience: [audience],
    DurationSeconds: tokenDurationSeconds,
    SigningAlgorithm: 'RS256'
  })

  const result = await client.send(command)
  return { token: result.WebIdentityToken, durationMs: tokenDurationSeconds * 1000 }
}

async function fetchAndCacheToken () {
  const { token, durationMs } = await fetchToken()

  cachedToken = token

  const nextRefreshMs = Math.max(durationMs - REFRESH_BUFFER_MS, 30000)

  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }
  refreshTimer = setTimeout(scheduleRefresh, nextRefreshMs)
}

async function scheduleRefresh () {
  logger.info('Refreshing service-to-service JWT token')
  try {
    await fetchAndCacheToken()
  } catch (err) {
    logger.error(err, 'Failed to refresh service-to-service JWT token')
    refreshTimer = setTimeout(scheduleRefresh, 30000)
  }
}

export async function initServiceTokenCache () {
  logger.info('Initialising service-to-service JWT token cache')
  await fetchAndCacheToken()
}

export function getServiceToken () {
  return cachedToken
}
