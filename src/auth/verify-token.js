import { createPublicKey } from 'node:crypto'
import Jwt from '@hapi/jwt'
import { getOidcConfig } from './get-oidc-config.js'

// The signing keys rarely rotate, so cache them in memory to avoid
// re-fetching the JWKS on every sign-in.
const CACHE_DURATION_MS = 60 * 60 * 1000

let cached = { keys: null, expiresAt: 0 }

async function fetchJwks () {
  const { jwks_uri: uri } = await getOidcConfig()
  const response = await fetch(uri)
  const { keys } = await response.json()

  cached = { keys, expiresAt: Date.now() + CACHE_DURATION_MS }

  return keys
}

async function getJwks () {
  if (cached.keys && Date.now() < cached.expiresAt) {
    return cached.keys
  }
  return fetchJwks()
}

function findJwk (keys, kid) {
  return keys.find(k => k.kid === kid || k.x5t === kid)
}

async function verifyToken (token) {
  const decoded = Jwt.token.decode(token)
  const { header } = decoded.decoded

  let keys = await getJwks()
  let jwk = findJwk(keys, header.kid)

  // Keys may have rotated since we cached them - refresh once before giving up
  if (!jwk) {
    keys = await fetchJwks()
    jwk = findJwk(keys, header.kid)
  }

  if (!jwk) {
    throw new Error(`No matching JWK for kid ${header.kid}`)
  }

  const pem = createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' })

  Jwt.token.verify(decoded, { key: pem, algorithm: 'RS256' })
}

export { verifyToken }
