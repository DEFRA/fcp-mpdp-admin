import { describe, test, expect } from 'vitest'
import { getUrlParams } from '../../../src/api/get-url-params.js'

describe('Backend API: getUrlParams', () => {
  test('getUrlParams function returns correct value', () => {
    const page = '__TEST_ROTUE__'
    const obj = {
      val: '__VALUE__',
      anotherVal: '__ANOTHER_VALUE__'
    }

    const url = getUrlParams(page, obj)

    expect(url).toMatch(`/${page}?val=${obj.val}&anotherVal=${obj.anotherVal}`)
  })
})
