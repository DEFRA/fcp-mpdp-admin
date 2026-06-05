import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest'

vi.mock('../../../src/config/config.js', () => ({
  config: { get: vi.fn() }
}))

vi.mock('../../../src/common/helpers/service-token.js', () => ({}))

vi.mock('../../../src/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn()
  })
}))

const { config } = await import('../../../src/config/config.js')

describe('service-token plugin', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('plugin metadata', () => {
    test('has the correct plugin name', async () => {
      config.get.mockReturnValue(false)
      const { serviceToken } = await import('../../../src/plugins/service-token.js')
      expect(serviceToken.plugin.name).toBe('service-token')
    })

    test('has a register function', async () => {
      const { serviceToken } = await import('../../../src/plugins/service-token.js')
      expect(serviceToken.plugin.register).toBeInstanceOf(Function)
    })
  })

  describe('when service-to-service auth is disabled', () => {
    beforeEach(() => {
      config.get.mockReturnValue(false)
    })

    test('register completes without error', async () => {
      const { serviceToken } = await import('../../../src/plugins/service-token.js')
      expect(() => serviceToken.plugin.register({})).not.toThrow()
    })
  })

  describe('when service-to-service auth is enabled', () => {
    beforeEach(() => {
      config.get.mockReturnValue(true)
    })

    test('register completes without error', async () => {
      const { serviceToken } = await import('../../../src/plugins/service-token.js')
      expect(() => serviceToken.plugin.register({})).not.toThrow()
    })
  })
})
