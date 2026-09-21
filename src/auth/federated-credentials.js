import { STSClient, GetWebIdentityTokenCommand } from '@aws-sdk/client-sts'
import { buildRedisClient } from '../common/helpers/redis-client.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { config } from '../config/config.js'

const logger = createLogger()

// AWS STS tokens are short-lived (≤ 900s), so we cache them in Redis to avoid
// requesting a new one on every Entra token exchange/refresh.

const AUDIENCE = config.get('federatedCredentials.audience')
const TOKEN_DURATION_SECONDS = config.get('federatedCredentials.tokenDurationSeconds')

const REDIS_TOKEN_KEY = 'federated-credentials-token'

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
    Audience: [AUDIENCE],
    DurationSeconds: TOKEN_DURATION_SECONDS,
    SigningAlgorithm: 'RS256'
  })

  const result = await client.send(command)
  return result
}

// Returns a still-valid token from Redis, or fetches a fresh one from STS and caches it.
// The Redis TTL matches the token's own lifetime, which is already comfortably under AWS's 900s cap.
async function getCachedFederatedToken () {
  const cached = await getRedisClient().get(REDIS_TOKEN_KEY)

  if (cached) {
    return cached
  }

  logger.info('Fetching AWS STS federated identity token')
  const result = await getFederatedToken()

  await getRedisClient().set(REDIS_TOKEN_KEY, result.WebIdentityToken, 'EX', TOKEN_DURATION_SECONDS)

  return result.WebIdentityToken
}

// Returns the client credential parameters for Entra token requests.
// When federated credentials are enabled, returns client_assertion params;
// otherwise returns client_secret. Used by both auth.js and refresh-tokens.js.
async function getClientCredentialParams () {
  if (config.get('federatedCredentials.enabled')) {
    return {
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: await getCachedFederatedToken()
    }
  }
  return { client_secret: config.get('entra.clientSecret') }
}

export { getFederatedToken, getCachedFederatedToken, getClientCredentialParams }
