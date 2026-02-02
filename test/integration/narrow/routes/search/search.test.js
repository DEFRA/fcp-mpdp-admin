import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest'
import http2 from 'node:http2'
import * as cheerio from 'cheerio'
import { createServer } from '../../../../../src/server.js'
import { getOptions } from '../../../../utils/helpers.js'
import { expectPageTitle } from '../../../../utils/page-title-expect.js'
import { expectHeader } from '../../../../utils/header-expect.js'
import { expectPhaseBanner } from '../../../../utils/phase-banner-expect.js'
import { expectBackLink } from '../../../../utils/back-link-expect.js'
import { expectPageHeading } from '../../../../utils/page-heading-expect.js'
import { expectRelatedContent } from '../../../../utils/related-content-expect.js'
import { expectFooter } from '../../../../utils/footer-expect.js'

const { constants: httpConstants } = http2

vi.mock('../../../../../src/services/fetch-payment-data.js', () => ({
  fetchPaymentData: () => ({
    results: [],
    total: 0,
    filterOptions: { schemes: [], years: [], counties: [] }
  })
}))

describe('Search route', () => {
  let server
  let response
  let options
  let $

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    if (response) { return }

    options = getOptions('search', 'GET')

    response = await server.inject(options)
    $ = cheerio.load(response.payload)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should return status code 200 when hitting /search', async () => {
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('Check for common elements', () => {
    expectPageTitle($, 'Search for an agreement holder')
    expectHeader($)
    expectPhaseBanner($)
    expectPageHeading($, 'Search for an agreement holder')
    expectRelatedContent($, 'search')
    expectFooter($)
  })

  test('Should render a back link with referer', async () => {
    options = getOptions('search', 'GET')
    options.headers = {
      referer: '/previous-page'
    }

    response = await server.inject(options)
    $ = cheerio.load(response.payload)

    expectBackLink($, '/previous-page', 'Back')
  })

  test('Check for search page specific elements', () => {
    const searchBox = $('#search-input')
    const button = $('.govuk-button')
    const form = $('#search-form')
    const downloadAllLink = $('#download-all-scheme-payment-data-link')

    expect(searchBox).toBeDefined()

    expect(button).toBeDefined()
    expect(button.text()).toMatch('Search')

    expect(form.attr('action')).toMatch('/results')
    expect(form.attr('method')).toMatch('get')

    expect(downloadAllLink.attr('href')).toMatch('/all-scheme-payment-data/file')
    expect(downloadAllLink.text()).toMatch('download all scheme payment data (5.7MB)')
  })

  test('Should GET /results route returning results page after query submission', async () => {
    const searchString = '__TEST_STRING__'
    const options = getOptions('results', 'GET', { searchString })

    response = await server.inject(options)
    $ = cheerio.load(response.payload)

    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    expectPageHeading($, `We found no results for ‘${searchString}’`)

    const searchBox = $('#results-search-input')

    expect(searchBox).toBeDefined()
    expect(searchBox.val()).toMatch(searchString)
    expect($('#total-results').text()).toMatch('0 results')
  })

  describe('Search error', () => {
    beforeAll(async () => {
      const options = getOptions('results', 'GET', { searchString: '' })
      response = await server.inject(options)
      $ = cheerio.load(response.payload)
    })

    test('Invalid query triggers error on /results', async () => {
      const errorSummary = $('.govuk-error-summary__title')

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)

      expect(errorSummary).toBeDefined()
      expect(errorSummary.text()).toMatch('There is a problem')

      expect($('#results-search-input')).toBeDefined()
      expect($('.govuk-form-group.govuk-form-group--error')).toBeDefined()
      expect($('#search-input-error').text()).toContain('Enter a name or location')
    })

    test('Should render common elements on invalid query submission', () => {
      expectPageTitle($, 'Error: Search for an agreement holder')
      expectPageHeading($, 'Search for an agreement holder')
      expectRelatedContent($)
    })
  })
})
