import { describe, test, expect } from 'vitest'
import Yar from '@hapi/yar'

import { session } from '../../../src/plugins/session.js'

describe('session', () => {
  test('should export session plugin object', () => {
    expect(session).toBeDefined()
    expect(session.plugin).toBe(Yar)
    expect(session.options).toBeDefined()
  })

  test('should use Yar plugin', () => {
    expect(session.plugin).toBe(Yar)
  })

  test('should configure storeBlank to false', () => {
    expect(session.options.storeBlank).toBe(false)
  })

  test('should configure maxCookieSize to 0', () => {
    expect(session.options.maxCookieSize).toBe(0)
  })

  test('should configure cache with segment ending in -temp', () => {
    expect(session.options.cache.segment).toContain('-temp')
  })

  test('should configure cookie options with password', () => {
    expect(session.options.cookieOptions.password).toBeDefined()
    expect(typeof session.options.cookieOptions.password).toBe('string')
  })

  test('should configure isSecure based on environment', () => {
    expect(typeof session.options.cookieOptions.isSecure).toBe('boolean')
  })

  test('should set isSameSite to Lax', () => {
    expect(session.options.cookieOptions.isSameSite).toBe('Lax')
  })

  test('should configure cache name', () => {
    expect(session.options.cache.cache).toBeDefined()
  })
})
