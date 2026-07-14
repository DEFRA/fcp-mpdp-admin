import { describe, test, expect } from 'vitest'
import { getSafeRedirect } from '../../../../src/common/helpers/get-safe-redirect.js'

describe('get-safe-redirect', () => {
  describe('getSafeRedirect', () => {
    test('should return valid redirect URL when it starts with /', () => {
      const result = getSafeRedirect('/admin/payments')
      expect(result).toBe('/admin/payments')
    })

    test.each([
      ['//evil.com/phishing', 'protocol-relative URL'],
      ['http://evil.com/phishing', 'external URL'],
      [null, 'null redirect'],
      [undefined, 'undefined redirect'],
      ['', 'empty string'],
      ['admin/payments', 'relative path without leading slash'],
      ['javascript:alert(1)', 'javascript URI'],
      ['data:text/html,<script>alert(1)</script>', 'data URL']
    ])('should return / for %s — %s', (input) => {
      const result = getSafeRedirect(input)
      expect(result).toBe('/')
    })

    test('should return valid redirect for nested path', () => {
      const result = getSafeRedirect('/admin/summary/edit/123')
      expect(result).toBe('/admin/summary/edit/123')
    })

    test('should return valid redirect with query parameters', () => {
      const result = getSafeRedirect('/admin/payments?page=2&limit=20')
      expect(result).toBe('/admin/payments?page=2&limit=20')
    })

    test('should return valid redirect with hash', () => {
      const result = getSafeRedirect('/admin/payments#section')
      expect(result).toBe('/admin/payments#section')
    })

    test('should return / for backslash at start', () => {
      const result = getSafeRedirect(String.raw`\admin\payments`)
      expect(result).toBe('/')
    })
  })
})
