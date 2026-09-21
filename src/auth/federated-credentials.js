import { STSClient, GetWebIdentityTokenCommand } from '@aws-sdk/client-sts'
import { buildRedisClient } from '../common/helpers/redis-client.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { config } from '../config/config.js'

const logger = createLogger()

const AUDIENCE = config.get('federatedCredentials.audience')
const TOKEN_DURATION_SECONDS = config.get('federatedCredentials.tokenDurationSeconds')

const REDIS_TOKEN_KEY = 'federated-credentials-token'
const MIN_VALIDITY_BUFFER_SECONDS = 10

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

async function getCachedFederatedToken () {
  const cached = await getRedisClient().get(REDIS_TOKEN_KEY)

  if (cached) {
    return cached
  }

  logger.info('Fetching AWS STS federated identity token')
  const result = await getFederatedToken()

  const ttlSeconds = Math.max(
    Math.floor((result.Expiration.getTime() - Date.now()) / 1000) - MIN_VALIDITY_BUFFER_SECONDS,
    1
  )
  await getRedisClient().set(REDIS_TOKEN_KEY, result.WebIdentityToken, 'EX', ttlSeconds)

  return result.WebIdentityToken
}

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
