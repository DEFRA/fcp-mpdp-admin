import { vi, describe, beforeAll, afterAll, test, expect } from 'vitest'
import http2 from 'node:http2'
import * as cheerio from 'cheerio'
import { createServer } from '../../../../src/server.js'
import { getOptions } from '../../../utils/helpers.js'
import { expectPageTitle } from '../../../utils/page-title-expect.js'
import { expectHeader } from '../../../utils/header-expect.js'
import { expectPhaseBanner } from '../../../utils/phase-banner-expect.js'
import { expectBackLink } from '../../../utils/back-link-expect.js'
import { expectPageHeading } from '../../../utils/page-heading-expect.js'
import { expectRelatedContent } from '../../../utils/related-content-expect.js'
import { expectFooter } from '../../../utils/footer-expect.js'

const { constants: httpConstants } = http2

vi.mock('../../../../src/services/fetch-scheme-payments-by-year.js', () => ({
  fetchSchemePaymentsByYear: () => ({
    '22/23': [
      {
        scheme: 'Sustainable Farming Incentive',
        financial_year: '22/23',
        total_amount: '3761.00'
      }
    ],
    '21/22': [
      {
        scheme: 'Sustainable Farming Incentive',
        financial_year: '21/22',
        total_amount: '1436025.00'
      },
      {
        scheme: 'Farming Resilience Fund',
        financial_year: '21/22',
        total_amount: '1125893.00'
      }
    ]
  })
}))

describe('Scheme Payments by year route', () => {
  let server
  let response
  let $

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    if (response) { return }

    const options = getOptions('scheme-payments-by-year', 'GET')

    response = await server.inject(options)
    $ = cheerio.load(response.payload)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
    vi.resetAllMocks()
  })

  test('Should return status code 200 when hitting /scheme-payments-by-year', async () => {
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test.each([
    '#summary-panel',
    '#summary-details',
    '#report-problem',
    '#payments-by-year-summary-toggle',
    '#show-all-year-payments-button',
    '#more-actions'
  ])('Check for expected content to be defined', (id) => {
    expect($(id)).toBeDefined()
  })

  test('Check for page specific content', () => {
    expect($('#date-range').text()).toMatch('1 April 2021 to 31 March 2023')
    expect($('#total-schemes').text()).toMatch('Payments from 2 schemes')
    expect($('#total-years').text()).toMatch('Over 2 financial years')
    expect($('.yearly-activity').length).toBe(2)
    expect($('.scheme-activity').length).toBe(3)
  })

  test.each([
    { id: '#download-scheme-payments-by-year-link', href: '/scheme-payments-by-year/file', text: 'Download this data (.CSV)' },
    { id: '#call-charges', href: 'https://www.gov.uk/call-charges', text: 'Find out about call charges' },
    { id: '#sfi-query-form', href: 'https://www.gov.uk/government/publications/sustainable-farming-incentive-pilot-query-form', text: 'SFI pilot query form' },
    { id: '#new-search-link', href: '/search', text: 'start a new search' },
    { id: '#print-link', href: '#', text: 'print this page' }
  ])('All expected links are present', async ({ id, href, text }) => {
    const linkElement = $(id)
    expect(linkElement).toBeDefined()
    expect(linkElement.attr('href')).toContain(href)
    expect(linkElement.text()).toMatch(text)
  })

  test('Check for common elements', () => {
    expectPageTitle($, 'Scheme payments by year')
    expectHeader($)
    expectPhaseBanner($)
    expectBackLink($, '/', 'Back')
    expectPageHeading($, 'Scheme payments by year')
    expectRelatedContent($, 'scheme-payments-by-year')
    expectFooter($)
  })
})
