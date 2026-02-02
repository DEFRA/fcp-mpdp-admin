import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest'
import * as cheerio from 'cheerio'
import http2 from 'node:http2'
import { createServer } from '../../../../src/server.js'
import { getOptions } from '../../../utils/helpers.js'
import { mockDetails } from '../../../data/mock-details.js'
import { expectPageTitle } from '../../../utils/page-title-expect.js'
import { expectHeader } from '../../../utils/header-expect.js'
import { expectPhaseBanner } from '../../../utils/phase-banner-expect.js'
import { expectBackLink } from '../../../utils/back-link-expect.js'
import { expectPageHeading } from '../../../utils/page-heading-expect.js'
import { expectRelatedContent } from '../../../utils/related-content-expect.js'
import { expectFooter } from '../../../utils/footer-expect.js'

const { constants: httpConstants } = http2

vi.mock('../../../../src/services/fetch-payment-details.js', () => {
  return {
    fetchPaymentDetails: vi.fn(async (payeeName, partPostcode) => {
      return mockDetails.find(
        details =>
          details.payee_name.toLowerCase().includes(payeeName.toLowerCase()) &&
          details.part_postcode.toLowerCase() === partPostcode.toLowerCase()
      )
    })
  }
})

describe('Details route', () => {
  let server
  let options
  let response
  let $

  const searchString = 'Carter'
  const page = '1'

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    if (response) { return }

    options = getOptions(
      'details',
      'GET',
      {
        searchString,
        payeeName: 'T R Carter & Sons 1',
        partPostcode: 'RG1',
        page
      }
    )

    response = await server.inject(options)
    $ = cheerio.load(response.payload)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should return status code 200 when hitting the details page', async () => [
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  ])

  test.each([
    '#mpdp-summary-breakdown',
    '#mpdp-more-actions',
    '#report-problem',
    '#toggle-button',
    '#summary-toggle',
    '#show-all-button',
    '#download-details-link',
    '#scheme-more-info-1',
    '#scheme-more-info-2'
  ])('Check page-specific elements is defined', (id) => {
    expect($(id)).toBeDefined()
  })

  test('Check common content is rendered', () => {
    expect($('#date-range').text()).toMatch('1 April 2021 to 31 March 2023')
    expect($('#total-schemes').text()).toMatch('Payments from 2 schemes')
    expect($('#total-years').text()).toMatch('Over 2 financial years')
    expect($('.schemeDetails').length).toBe(2)
    expect($('.schemeActivity').length).toBe(4)
  })

  test.each([
    { id: '#call-charges', href: 'https://www.gov.uk/call-charges', text: 'Find out about call charges' },
    { id: '#sfi-query-form', href: 'https://www.gov.uk/government/publications/sustainable-farming-incentive-pilot-query-form', text: 'SFI pilot query form' },
    { id: '#new-search-link', href: '/search', text: 'start a new search' },
    { id: '#print-link', href: '#', text: 'print this page' },
    { id: '#download-details-link', href: '/details/file?payeeName=T%20R%20Carter%20%26%20Sons%201&partPostcode=RG1', text: 'Download this data (.CSV)' }
  ])('Check all expected links are present', ({ id, href, text }) => {
    const link = $(id)
    expect(link).toBeDefined()
    expect(link.attr('href')).toMatch(href)
    expect(link.text()).toMatch(text)
  })

  test('Should render all common elements', () => {
    expectPageTitle($, 'T R Carter & Sons 1')
    expectHeader($)
    expectPhaseBanner($)
    expectPageHeading($, 'T R Carter & Sons 1')
    expectBackLink($, `/results?searchString=${searchString}&page=${page}`, 'Back to results')
    expectPageHeading($, 'T R Carter & Sons 1')
    expectRelatedContent($, 'details')
    expectFooter($)
  })

  test('Should show validation error when query params are invalid', async () => {
    const invalidOptions = getOptions(
      'details',
      'GET',
      {
        searchString: ''
      }
    )

    const invalidResponse = await server.inject(invalidOptions)
    const invalidPayload = cheerio.load(invalidResponse.payload)
    const errorText = invalidPayload('.govuk-error-summary__list li a').text()
    const errorHref = invalidPayload('.govuk-error-summary__list li a').attr('href')

    expect(invalidResponse.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
    expect(errorText).toMatch('Enter a name or location')
    expect(errorHref).toBe('#search-input')
    expectPageTitle(invalidPayload, 'Error: Search for an agreement holder')
    expectRelatedContent(invalidPayload, 'details')
  })
})
