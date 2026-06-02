import {
  CognitoIdentityClient,
  GetOpenIdTokenForDeveloperIdentityCommand
} from '@aws-sdk/client-cognito-identity'
import { createLogger } from '../common/helpers/logging/logger.js'
import { config } from '../config/config.js'

const logger = createLogger()

// The Cognito token is short-lived (~1 hour). We cache it in memory and refresh
// it before expiry so Bell's synchronous tokenParams function can access it.
// Note: this module uses an in-process singleton. If multiple server instances
// share a process (e.g. tests), they share the cache.

const tokenRefreshBufferMs = 10 * 60 * 1000 // refresh 10 min before expiry

let cachedToken = null
let refreshTimer = null

async function getCognitoToken () {
  const client = new CognitoIdentityClient()

  const command = new GetOpenIdTokenForDeveloperIdentityCommand({
    IdentityPoolId: config.get('cognito.identityPoolId'),
    Logins: {
      'fcp-mpdp-admin-aad-access': 'fcp-mpdp-admin'
    }
  })

  const result = await client.send(command)
  return result
}

async function refreshCachedToken () {
  try {
    logger.info('Refreshing Cognito federated token')
    const result = await getCognitoToken()
    cachedToken = result.Token

    // TokenDuration is in seconds; schedule next refresh before expiry
    const tokenDurationMs = (result.TokenDuration ?? 3600) * 1000
    const nextRefreshMs = Math.max(tokenDurationMs - tokenRefreshBufferMs, 60000)

    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }
    refreshTimer = setTimeout(refreshCachedToken, nextRefreshMs)
    logger.info(`Cognito token cached, next refresh in ${Math.round(nextRefreshMs / 60000)} minutes`)
  } catch (err) {
    logger.error(err, 'Failed to refresh Cognito federated token')
    // Retry after 1 minute on failure
    refreshTimer = setTimeout(refreshCachedToken, 60000)
  }
}

async function initCognitoTokenCache () {
  await refreshCachedToken()
}

function getCachedCognitoToken () {
  return cachedToken
}

export { getCognitoToken, initCognitoTokenCache, getCachedCognitoToken }
