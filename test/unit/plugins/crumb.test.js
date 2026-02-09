import { describe, test, expect } from 'vitest'
import Crumb from '@hapi/crumb'
import { crumb } from '../../../src/plugins/crumb.js'

describe('crumb', () => {
  test('should export crumb plugin object', () => {
    expect(crumb).toBeDefined()
    expect(crumb.plugin).toBe(Crumb)
    expect(crumb.options).toBeDefined()
  })

  test('should use Crumb plugin', () => {
    expect(crumb.plugin).toBe(Crumb)
  })

  test('should configure cookieOptions with isSecure based on environment', () => {
    expect(typeof crumb.options.cookieOptions.isSecure).toBe('boolean')
  })

  test('should have cookieOptions defined', () => {
    expect(crumb.options.cookieOptions).toBeDefined()
    expect(typeof crumb.options.cookieOptions).toBe('object')
  })
})
