import Wreck from '@hapi/wreck'
import { getClientCredentialParams } from './federated-credentials.js'
import { getOidcConfig } from './get-oidc-config.js'
import { config } from '../config/config.js'

async function refreshTokens (refreshToken) {
  const { token_endpoint: url } = await getOidcConfig()

  const clientId = config.get('entra.clientId')
  const params = new URLSearchParams({
    client_id: clientId,
    ...getClientCredentialParams(),
    grant_type: 'refresh_token',
    scope: `${clientId}/.default offline_access`,
    refresh_token: refreshToken,
    redirect_uri: config.get('entra.redirectUrl')
  })

  const { payload } = await Wreck.post(`${url}?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    json: true
  })

  // Payload will include both a new access token and a new refresh token
  // Refresh tokens can only be used once, so the new refresh token should be stored in place of the old one
  return payload
}

export { refreshTokens }
