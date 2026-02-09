import path from 'node:path'
import { readFileSync } from 'node:fs'
import { config } from '../config.js'
import { createLogger } from '../../common/helpers/logging/logger.js'

const logger = createLogger()
const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/assets-manifest.json'
)

let webpackManifest

export async function context (request) {
  const ctx = request.response.source?.context || {}

  if (!webpackManifest) {
    try {
      webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch (err) {
      logger.error(`Webpack ${path.basename(manifestPath)} not found`)
    }
  }

  const defaultContext = {
    ...ctx,
    assetPath: `${assetPath}/assets/rebrand`,
    serviceName: config.get('serviceName'),
    serviceUrl: '/',
    breadcrumbs: [],
    getAssetPath (asset) {
      const webpackAssetPath = webpackManifest?.[asset]
      return `${assetPath}/${webpackAssetPath ?? asset}`
    }
  }

  if (!request.auth?.isAuthenticated || !request.auth?.credentials?.sessionId) {
    return defaultContext
  }

  try {
    const auth = await request.server.app.cache.get(request.auth.credentials.sessionId)
    return {
      ...defaultContext,
      auth
    }
  } catch (error) {
    // If cache lookup fails, return context without auth to prevent circular errors
    request.log(['warn', 'views'], `Failed to get auth from cache: ${error.message}`)
    return defaultContext
  }
}
