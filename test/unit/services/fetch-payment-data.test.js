import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest'
import Wreck from '@hapi/wreck'
import { fetchPaymentData } from '../../../src/services/fetch-payment-data.js'
import { config } from '../../../src/config/config.js'

const endpoint = 'https://__TEST_ENDPOINT__'
process.env.MPDP_BACKEND_ENDPOINT = endpoint
const path = process.env.MPDP_BACKEND_PATH

describe('fetchPaymentData', () => {
  const mockData = [{
    payee_name: 'T R Carter & Sons 1',
    part_postcode: 'RG1',
    town: 'Reading',
    county_council: 'Berkshire',
    amount: '11142000.95'
  }]

  beforeEach(() => {
    config.load({})
    config.validate({ allowed: 'strict' })

    vi.spyOn(config, 'get').mockImplementation(key => {
      if (key === 'backend.endpoint') return endpoint
      if (key === 'backend.path') return path
      if (key === 'search.limit') return 20
      return config[key]
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('fetchPaymentData return empty results list if no response is received', async () => {
    const mockPost = vi.fn().mockResolvedValue(null)
    vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

    const searchString = '__TEST_STRING__'
    const offset = 0
    const sortBy = 'score'
    const filterBy = { schemes: [] }
    const res = await fetchPaymentData(searchString, offset, filterBy, sortBy)

    expect(res).toMatchObject({
      results: [],
      total: 0,
      filterOptions: {}
    })

    expect(mockPost).toHaveBeenCalledWith(`${endpoint}${path}`, { payload: { filterBy, limit: 20, offset, searchString, sortBy } })
  })

  test('getPaymentData returns results from the payload in the right format', async () => {
    const mockPost = vi.fn().mockResolvedValue({
      payload: JSON.stringify({
        rows: mockData,
        count: 1,
        filterOptions: {}
      })
    })

    vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

    const searchString = '__TEST_STRING__'
    const offset = 0
    const filterBy = { schemes: [] }
    const sortBy = 'score'
    const res = await fetchPaymentData(searchString, offset, filterBy, sortBy)

    expect(res).toMatchObject({
      results: mockData,
      total: mockData.length,
      filterOptions: {}
    })

    expect(mockPost).toHaveBeenCalledWith(`${endpoint}${path}`, { payload: { filterBy, limit: 20, offset, searchString, sortBy } })
  })

  test('getPaymentData called with download action', async () => {
    const mockPost = vi.fn().mockResolvedValue({
      payload: JSON.stringify({
        rows: mockData,
        count: 1
      })
    })

    vi.spyOn(Wreck, 'post').mockImplementation(mockPost)

    const searchString = '__TEST_STRING__'
    const offset = 0
    const filterBy = { schemes: [] }
    const sortBy = 'score'
    const action = 'download'
    const res = await fetchPaymentData(searchString, offset, filterBy, sortBy, action)

    expect(res).toMatchObject({
      results: mockData,
      total: mockData.length
    })

    expect(mockPost).toHaveBeenCalledWith(`${endpoint}${path}`, { payload: { filterBy, limit: 20, offset, searchString, sortBy, action } })
  })
})
