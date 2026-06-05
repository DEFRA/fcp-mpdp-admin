import { STSClient, GetWebIdentityTokenCommand } from '@aws-sdk/client-sts'
import { createLogger } from './logging/logger.js'
import { config } from '../../config/config.js'

const logger = createLogger()

const EXPIRY_BUFFER_MS = 30 * 1000

let cached = { token: null, expiresAt: 0 }

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
  return {
    token: result.WebIdentityToken,
    expiresAt: Date.now() + tokenDurationSeconds * 1000 - EXPIRY_BUFFER_MS
  }
}

export async function getServiceToken () {
  if (!cached.token || Date.now() >= cached.expiresAt) {
    logger.info('Fetching service-to-service JWT token')
    cached = await fetchToken()
  }
  return cached.token
}
