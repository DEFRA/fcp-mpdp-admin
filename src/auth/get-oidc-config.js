import { config } from '../config/config.js'

async function getOidcConfig () {
  const response = await fetch(config.get('entra.wellKnownUrl'))
  return response.json()
}

export { getOidcConfig }
