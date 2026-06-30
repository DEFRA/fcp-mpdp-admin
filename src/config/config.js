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
      default: false
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
  federatedCredentials: {
    enabled: {
      doc: 'Use AWS STS federated credentials instead of a client secret for Entra authentication.',
      format: Boolean,
      default: false,
      env: 'FEDERATED_CREDENTIALS_ENABLED'
    },
    audience: {
      doc: 'The audience value used when requesting a federated identity token from AWS STS.',
      format: String,
      nullable: true,
      default: 'api://AzureADTokenExchange',
      env: 'FEDERATED_AUDIENCE'
    },
    tokenDurationSeconds: {
      doc: 'Lifetime of the STS identity token in seconds. Must be greater than 0 and less than 900.',
      format: (val) => {
        if (typeof val !== 'number' || val <= 0 || val >= 900) {
          throw new Error('tokenDurationSeconds must be > 0 and < 900')
        }
      },
      default: 850,
      env: 'FEDERATED_TOKEN_DURATION_SECONDS'
    }
  },
  redis: {
    host: {
      doc: 'The Redis cache host.',
      format: String,
      default: null,
      env: 'REDIS_HOST'
    },
    username: {
      doc: 'The Redis cache username.',
      format: String,
      default: '',
      env: 'REDIS_USERNAME'
    },
    password: {
      doc: 'The Redis cache password.',
      format: '*',
      default: process.env.NODE_ENV === 'production' ? null : undefined,
      sensitive: true,
      env: 'REDIS_PASSWORD'
    },
    keyPrefix: {
      doc: 'Redis cache key prefix name used to isolate the cached results across multiple clients',
      format: String,
      default: 'fcp-mpdp-admin:',
      env: 'REDIS_KEY_PREFIX'
    },
    useSingleInstanceCache: {
      doc: 'Connect to a single instance of redis instead of a cluster.',
      format: Boolean,
      default: !isProduction,
      env: 'USE_SINGLE_INSTANCE_CACHE'
    },
    useTLS: {
      doc: 'Connect to redis using TLS',
      format: Boolean,
      default: isProduction,
      env: 'REDIS_TLS'
    },
    ttl: {
      doc: 'The cache TTL.',
      format: Number,
      default: 1000 * 60 * 60 * 24,
      env: 'REDIS_TTL'
    }
  },
  serviceAuth: {
    enabled: {
      doc: 'Enable service-to-service JWT authentication when calling the backend',
      format: Boolean,
      default: false,
      env: 'SERVICE_AUTH_ENABLED'
    },
    audience: {
      doc: 'JWT audience for service-to-service authentication',
      format: String,
      default: 'fcp-mpdp-backend',
      env: 'SERVICE_AUTH_AUDIENCE'
    },
    tokenDurationSeconds: {
      doc: 'Duration in seconds for the service-to-service JWT token',
      format: Number,
      default: 300,
      env: 'SERVICE_AUTH_TOKEN_DURATION'
    }
  },
})

config.validate({ allowed: 'strict' })
