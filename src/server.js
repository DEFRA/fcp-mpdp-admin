import path from 'node:path'
import Hapi from '@hapi/hapi'
import Scooter from '@hapi/scooter'
import Joi from 'joi'
import Bell from '@hapi/bell'
import Cookie from '@hapi/cookie'
import { Engine as CatboxRedis } from '@hapi/catbox-redis'
import { auth } from './plugins/auth.js'
import { session } from './plugins/session.js'
import { contentSecurityPolicy } from './plugins/content-security-policy.js'
import { headers } from './plugins/headers.js'
import { router } from './plugins/router.js'
import { userAgentProtection } from './plugins/user-agent-protection.js'
import { crumb } from './plugins/crumb.js'
import { config } from './config/config.js'
import { pulse } from './common/helpers/pulse.js'
import { catchAll } from './common/helpers/errors.js'
import { nunjucksConfig } from './config/nunjucks/nunjucks.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'
import { secureContext } from './common/helpers/secure-context/secure-context.js'
import { buildRedisClient } from './common/helpers/redis-client.js'

export async function createServer () {
  setupProxy()
  const server = Hapi.server({
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    },
    state: {
      strictHeader: false
    },
    cache: [{
      name: 'redis',
      engine: new CatboxRedis({ client: buildRedisClient(config.get('redis')) })
    }]
  })

  server.app.cache = server.cache({
    cache: 'redis',
    segment: 'session',
    expiresIn: config.get('redis.ttl')
  })

  server.validator(Joi)

  await server.register([
    userAgentProtection, // Must be registered before Scooter to intercept malicious User-Agents
    Scooter,
    Bell,
    Cookie,
    auth,
    session,
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    nunjucksConfig,
    contentSecurityPolicy,
    headers,
    crumb,
    router
  ])

  server.ext('onPreResponse', catchAll)

  return server
}
