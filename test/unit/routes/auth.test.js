import { describe, test, expect } from 'vitest'
import { toReasonString } from '../../../src/routes/auth.js'

describe('toReasonString', () => {
  test('should return undefined unchanged', () => {
    expect(toReasonString(undefined)).toBeUndefined()
  })

  test('should return null unchanged', () => {
    expect(toReasonString(null)).toBeNull()
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
})
