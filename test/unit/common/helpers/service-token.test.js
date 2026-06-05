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
      if (key === 'serviceAuth.audience') return 'fcp-mpdp-backend'
      if (key === 'serviceAuth.tokenDurationSeconds') return 300
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetModules()
  })

  test('fetches and returns a token on first call', async () => {
    const { getServiceToken } = await import('../../../../src/common/helpers/service-token.js')
    const token = await getServiceToken()
    expect(token).toBe('mock-token-123')
  })

  test('returns cached token on second call without fetching again', async () => {
    const { STSClient } = await import('@aws-sdk/client-sts')
    const sendSpy = vi.spyOn(STSClient.prototype, 'send')
    const { getServiceToken } = await import('../../../../src/common/helpers/service-token.js')

    await getServiceToken()
    await getServiceToken()

    expect(sendSpy).toHaveBeenCalledTimes(1)
  })

  test('re-fetches token when it has expired', async () => {
    const { STSClient } = await import('@aws-sdk/client-sts')
    const sendSpy = vi.spyOn(STSClient.prototype, 'send')
    const { getServiceToken } = await import('../../../../src/common/helpers/service-token.js')

    await getServiceToken()

    // advance time past token expiry (300s duration - 30s buffer)
    vi.advanceTimersByTime(271 * 1000)

    await getServiceToken()

    expect(sendSpy).toHaveBeenCalledTimes(2)
  })

  test('does not re-fetch token before it has expired', async () => {
    const { STSClient } = await import('@aws-sdk/client-sts')
    const sendSpy = vi.spyOn(STSClient.prototype, 'send')
    const { getServiceToken } = await import('../../../../src/common/helpers/service-token.js')

    await getServiceToken()

    // advance time but stay within the valid window
    vi.advanceTimersByTime(60 * 1000)

    await getServiceToken()

    expect(sendSpy).toHaveBeenCalledTimes(1)
  })
})
