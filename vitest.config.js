import { defineConfig, configDefaults } from 'vitest/config'

const sharedEnv = {
  NODE_ENV: 'test',
  ENTRA_TENANT_ID: 'test-tenant-id',
  ENTRA_WELL_KNOWN_URL: 'https://login.microsoftonline.com/test-tenant-id/v2.0/.well-known/openid-configuration',
  ENTRA_CLIENT_ID: 'test-client-id',
  ENTRA_CLIENT_SECRET: 'test-client-secret',
  COOKIE_PASSWORD: 'test-cookie-password-at-least-32-chars!!',
  USE_SINGLE_INSTANCE_CACHE: 'true'
}

const coverageConfig = {
  provider: 'v8',
  reportsDirectory: './coverage',
  clean: false,
  reporter: ['text', 'lcov'],
  include: ['src/**'],
  exclude: [
    ...configDefaults.exclude,
    '**/test/**',
    'coverage',
    '.public',
    'postcss.config.js'
  ]
}

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    coverage: coverageConfig,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.js'],
          environment: 'node',
          env: sharedEnv
        }
      },
      {
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.js'],
          environment: 'node',
          env: sharedEnv,
          globalSetup: ['./test/setup/global-redis.js']
        }
      }
    ]
  }
})
