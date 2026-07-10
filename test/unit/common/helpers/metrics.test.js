import { vi, describe, test, expect } from 'vitest'

vi.mock('@defra/cdp-metrics', () => {
  class MockMetrics {
    constructor () {
      this.counter = vi.fn()
      this.millis = vi.fn()
    }
  }
  return { Metrics: MockMetrics }
})

vi.mock('../../../../src/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() })
}))

const { serverMetrics } = await import('../../../../src/common/helpers/metrics.js')

describe('metrics', () => {
  test('serverMetrics should expose counter method', () => {
    expect(serverMetrics.counter).toBeDefined()
  })

  test('serverMetrics should expose millis method', () => {
    expect(serverMetrics.millis).toBeDefined()
  })
})
