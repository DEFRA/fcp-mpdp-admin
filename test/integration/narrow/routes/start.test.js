import { describe, beforeAll, afterAll, test, expect } from 'vitest'
import http2 from 'node:http2'
import * as cheerio from 'cheerio'
import { createServer } from '../../../../src/server.js'
import { getOptions } from '../../../utils/helpers.js'
import { expectPageTitle } from '../../../utils/page-title-expect.js'
import { expectHeader } from '../../../utils/header-expect.js'
import { expectPhaseBanner } from '../../../utils/phase-banner-expect.js'
import { expectPageHeading } from '../../../utils/page-heading-expect.js'
import { expectRelatedContent } from '../../../utils/related-content-expect.js'
import { expectFooter } from '../../../utils/footer-expect.js'

const { constants: httpConstants } = http2

describe('Start route', () => {
  let server
  let response
  let $

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    if (response) { return }

    const options = getOptions('/', 'GET')

    response = await server.inject(options)
    $ = cheerio.load(response.payload)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should return status code 200 when hitting the start page', async () => {
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('Should render expected content', () => {
    const button = $('.govuk-main-wrapper .govuk-button')
    const viewYearlyTotalsLink = $('#view-yearly-totals')
    const downloadLink = $('#download-all-scheme-payment-data-link')
    const capLink = $('#cap-link')

    expectPageTitle($, '')
    expectHeader($)
    expectPhaseBanner($)
    expectPageHeading($, 'Find farm and land payment data')
    expect($('#published-data')).toBeDefined()
    expect(viewYearlyTotalsLink).toBeDefined()
    expect(viewYearlyTotalsLink.attr('href')).toMatch('/scheme-payments-by-year')
    expect(viewYearlyTotalsLink.text().trim()).toMatch('view yearly totals')
    expect(button.text()).toMatch('Start now')
    expect(button.attr('href')).toMatch('/search')
    expect(downloadLink).toBeDefined()
    expect(downloadLink.text()).toMatch('download all scheme payment data (5.7MB)')
    expect(downloadLink.attr('href')).toMatch('/all-scheme-payment-data/file')
    expect(capLink).toBeDefined()
    expect(capLink.attr('href')).toMatch('https://cap-payments.defra.gov.uk/Default.aspx')
    expectRelatedContent($, 'start')
    expectFooter($)
  })
})
