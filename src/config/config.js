import convict from 'convict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import convictFormatWithValidator from 'convict-format-with-validator'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const oneWeekMs = 604800000

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'
const isDevelopment = process.env.NODE_ENV === 'development'

convict.addFormats(convictFormatWithValidator)

export const config = convict({
  serviceVersion: {
    doc: 'The service version, this variable is injected into your docker container in CDP environments',
    format: String,
    nullable: true,
    default: null,
    env: 'SERVICE_VERSION'
  },
  host: {
    doc: 'The IP address to bind',
    format: 'ipaddress',
    default: '0.0.0.0',
    env: 'HOST'
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 3003,
    env: 'PORT'
  },
  staticCacheTimeout: {
    doc: 'Static cache timeout in milliseconds',
    format: Number,
    default: oneWeekMs,
    env: 'STATIC_CACHE_TIMEOUT'
  },
  serviceName: {
    doc: 'Applications Service Name',
    format: String,
    default: 'Find farm and land payment data'
  },
  root: {
    doc: 'Project root',
    format: String,
    default: path.resolve(dirname, '../..')
  },
  assetPath: {
    doc: 'Asset path',
    format: String,
    default: '/public',
    env: 'ASSET_PATH'
  },
  isProduction: {
    doc: 'If this application running in the production environment',
    format: Boolean,
    default: isProduction
  },
  isDevelopment: {
    doc: 'If this application running in the development environment',
    format: Boolean,
    default: isDevelopment
  },
  isTest: {
    doc: 'If this application running in the test environment',
    format: Boolean,
    default: isTest
  },
  log: {
    enabled: {
      doc: 'Is logging enabled',
      format: Boolean,
      default: process.env.NODE_ENV !== 'test',
      env: 'LOG_ENABLED'
    },
    level: {
      doc: 'Logging level',
      format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
      env: 'LOG_LEVEL'
    },
    format: {
      doc: 'Format to output logs in.',
      format: ['ecs', 'pino-pretty'],
      default: isProduction ? 'ecs' : 'pino-pretty',
      env: 'LOG_FORMAT'
    },
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: isProduction
        ? ['req.headers.authorization', 'req.headers.cookie', 'res.headers']
        : []
    }
  },
  httpProxy: {
    doc: 'HTTP Proxy',
    format: String,
    nullable: true,
    default: null,
    env: 'HTTP_PROXY'
  },
  isSecureContextEnabled: {
    doc: 'Enable Secure Context',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_SECURE_CONTEXT'
  },
  isMetricsEnabled: {
    doc: 'Enable metrics reporting',
    format: Boolean,
    default: isProduction,
    env: 'ENABLE_METRICS'
  },
  nunjucks: {
    watch: {
      doc: 'Reload templates when they are changed.',
      format: Boolean,
      default: isDevelopment
    },
    noCache: {
      doc: 'Use a cache and recompile templates each time',
      format: Boolean,
      default: isDevelopment
    }
  },
  tracing: {
    header: {
      doc: 'Which header to track',
      format: String,
      default: 'x-cdp-request-id',
      env: 'TRACING_HEADER'
    }
  },
  backend: {
    endpoint: {
      doc: 'Endpoint for fcp-mpdp-backend',
      format: String,
      nullable: true,
      default: null,
      env: 'MPDP_BACKEND_ENDPOINT'
    },
    path: {
      doc: 'Path for fcp-mpdp-backend endpoint',
      format: String,
      default: '/v1/payments',
      env: 'MPDP_BACKEND_PATH'
    }
  },
  search: {
    limit: {
      doc: 'Maximum number of search results that can be shown on the results page',
      format: 'nat',
      default: 20
    }
  },
  cookie: {
    password: {
      doc: 'The cookie password.',
      format: String,
      default: null,
      env: 'COOKIE_PASSWORD'
    },
    secure: {
      doc: 'set secure flag on cookie',
      format: Boolean,
      default: process.env.NODE_ENV === 'production',
      env: 'SESSION_COOKIE_SECURE'
    }
  },
  entra: {
    wellKnownUrl: {
      doc: 'The Entra well known URL.',
      format: String,
      nullable: true,
      default: null,
      env: 'ENTRA_WELL_KNOWN_URL'
    },
    clientId: {
      doc: 'The Entra client ID.',
      format: String,
      nullable: true,
      default: null,
      env: 'ENTRA_CLIENT_ID'
    },
    clientSecret: {
      doc: 'The Entra client secret.',
      format: String,
      nullable: true,
      default: null,
      env: 'ENTRA_CLIENT_SECRET'
    },
    redirectUrl: {
      doc: 'The Entra redirect URl.',
      format: String,
      nullable: true,
      default: null,
      env: 'ENTRA_REDIRECT_URL'
    },
    signOutRedirectUrl: {
      doc: 'The Entra sign out redirect URl.',
      format: String,
      nullable: true,
      default: null,
      env: 'ENTRA_SIGN_OUT_REDIRECT_URL'
    },
    refreshTokens: {
      doc: 'True if Entra refresh tokens are enabled.',
      format: Boolean,
      default: true,
      env: 'ENTRA_REFRESH_TOKENS'
    }
  },
  cache: {
    name: {
      doc: 'The cache name.',
      format: String,
      default: 'redis'
    },
    host: {
      doc: 'The Redis cache host.',
      format: String,
      default: null,
      env: 'REDIS_HOST'
    },
    port: {
      doc: 'The Redis cache port.',
      format: 'port',
      default: 6379,
      env: 'REDIS_PORT'
    },
    password: {
      doc: 'The Redis cache password.',
      format: String,
      default: process.env.NODE_ENV === 'production' ? null : undefined,
      env: 'REDIS_PASSWORD'
    },
    tls: {
      doc: 'True if the Redis cache is using TLS.',
      format: Object,
      default: process.env.NODE_ENV === 'production' ? {} : undefined
    },
    segment: {
      doc: 'The cache segment.',
      format: String,
      default: 'session'
    },
    ttl: {
      doc: 'The cache TTL.',
      format: Number,
      default: 1000 * 60 * 60 * 24,
      env: 'REDIS_TTL'
    }
  }
})

config.validate({ allowed: 'strict' })
