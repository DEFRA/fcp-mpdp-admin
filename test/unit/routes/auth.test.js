import { describe, test, expect } from 'vitest'
import { toReasonString } from '../../../src/routes/auth.js'

describe('toReasonString', () => {
  test('should return undefined for undefined', () => {
    expect(toReasonString(undefined)).toBeUndefined()
  })

  test('should return undefined for null', () => {
    expect(toReasonString(null)).toBeUndefined()
  })

  test('should convert a Buffer to a string', () => {
    expect(toReasonString(Buffer.from('invalid_client'))).toBe('invalid_client')
  })

  test('should return a string unchanged', () => {
    expect(toReasonString('invalid_client')).toBe('invalid_client')
  })

  test('should extract the message from an Error', () => {
    expect(toReasonString(new Error('connect ECONNREFUSED'))).toBe('connect ECONNREFUSED')
  })

  test('should JSON stringify a plain object', () => {
    expect(toReasonString({ error: 'invalid_client' })).toBe('{"error":"invalid_client"}')
  })
})
