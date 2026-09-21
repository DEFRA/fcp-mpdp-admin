import { config } from '../config/config.js'

// The discovery document rarely changes, so cache it in memory to avoid
// re-fetching it on every sign-in, sign-out and token refresh.
const CACHE_DURATION_MS = 60 * 60 * 1000

let cached = { config: null, expiresAt: 0 }

async function getOidcConfig () {
  if (cached.config && Date.now() < cached.expiresAt) {
    return cached.config
  }

  const response = await fetch(config.get('entra.wellKnownUrl'))
  const oidcConfig = await response.json()

  cached = { config: oidcConfig, expiresAt: Date.now() + CACHE_DURATION_MS }

  return oidcConfig
}

export { getOidcConfig }
