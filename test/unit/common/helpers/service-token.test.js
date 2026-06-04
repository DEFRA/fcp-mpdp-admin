import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'

vi.mock('../../../../src/config/config.js', () => ({
  config: { get: vi.fn() }
}))

vi.mock('@aws-sdk/client-sts', () => ({
  STSClient: class {
    async send () { return { WebIdentityToken: 'mock-token-123' } }
  },
  GetWebIdentityTokenCommand: class {}
}))

vi.mock('../../../../src/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn()
  })
}))

const { config } = await import('../../../../src/config/config.js')

describe('service-token helper', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    config.get.mockImplementation((key) => {
      if (key === 'serviceToServiceAuth.audience') return 'fcp-mpdp-backend'
      if (key === 'serviceToServiceAuth.tokenDurationSeconds') return 300
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetModules()
  })

  test('getServiceToken returns null before initialisation', async () => {
    const { getServiceToken } = await import('../../../../src/common/helpers/service-token.js')
    expect(getServiceToken()).toBeNull()
  })

  test('initServiceTokenCache fetches a token from STS and caches it', async () => {
    const { initServiceTokenCache, getServiceToken } = await import('../../../../src/common/helpers/service-token.js')

    await initServiceTokenCache()

    expect(getServiceToken()).toBe('mock-token-123')
  })

  test('initServiceTokenCache schedules a refresh timer', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
    const { initServiceTokenCache } = await import('../../../../src/common/helpers/service-token.js')

    await initServiceTokenCache()

    expect(setTimeoutSpy).toHaveBeenCalled()
  })

  test('initServiceTokenCache clears existing timer before scheduling new one', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    const { initServiceTokenCache } = await import('../../../../src/common/helpers/service-token.js')

    await initServiceTokenCache()
    await initServiceTokenCache()

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })
})
