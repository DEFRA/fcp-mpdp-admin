import { describe, afterEach, beforeEach, test, expect, vi } from 'vitest'
import Wreck from '@hapi/wreck'
import { fetchSearchSuggestions } from '../../../src/services/fetch-search-suggestions.js'
import { getUrlParams } from '../../../src/api/get-url-params.js'
import { config } from '../../../src/config/config.js'
import mockSuggestions from '../../data/mock-suggestions.js'

const endpoint = 'https://__TEST_ENDPOINT__'
process.env.MPDP_BACKEND_ENDPOINT = endpoint
const path = process.env.MPDP_BACKEND_PATH

describe('fetchSearchSuggestions', () => {
  beforeEach(() => {
    config.load({})
    config.validate({ allowed: 'strict' })

    vi.spyOn(config, 'get').mockImplementation(key => {
      if (key === 'backend.endpoint') return endpoint
      if (key === 'backend.path') return path
      return config[key]
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('should return default object if no response is received', async () => {
    const mockGet = vi.fn().mockResolvedValue(null)
    vi.spyOn(Wreck, 'get').mockImplementation(mockGet)

    const searchString = '__PAYEE_NAME__'
    const res = await fetchSearchSuggestions(searchString)

    expect(res).toEqual({ rows: [], count: 0 })

    const newRoute = getUrlParams('search', { searchString })

    expect(mockGet).toHaveBeenCalledWith(`${endpoint}${path}${newRoute}`)
  })

  test('should return results', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      payload: JSON.stringify(mockSuggestions)
    })

    vi.spyOn(Wreck, 'get').mockImplementation(mockGet)

    const searchString = '__TEST_STRING__'
    const res = await fetchSearchSuggestions(searchString)

    expect(res).toMatchObject(mockSuggestions)

    const newRoute = getUrlParams('search', { searchString })

    expect(mockGet).toHaveBeenCalledWith(`${endpoint}${path}${newRoute}`)
  })
})
