import { describe, beforeAll, afterAll, test, expect } from 'vitest'
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

describe('Accessibility route', () => {
  let server
  let response
  let options
  let $

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    if (response) { return }

    options = getOptions('accessibility', 'GET')

    response = await server.inject(options)
    $ = cheerio.load(response.payload)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should return status code 200  when hitting /accessibility', async () => {
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('Check for common elements', () => {
    expectPageTitle($, 'Accessibility statement for Find farm and land payment data')
    expectHeader($)
    expectPhaseBanner($)
    expectPageHeading($, 'Accessibility statement for Find farm and land payment data')
    expectRelatedContent($, 'accessibility')
    expectFooter($)
  })

  test('Should render a back link with referer', async () => {
    options.headers = {
      referer: '/previous-page'
    }

    response = await server.inject(options)
    $ = cheerio.load(response.payload)

    expectBackLink($, '/previous-page', 'Back')
  })

  test.each([
    { reference: 'equality advisory and support service', id: '#eass-link', url: 'https://www.equalityadvisoryservice.com/' },
    { reference: 'web content accessibility guidelines', id: '#wcag-link', url: 'https://www.w3.org/TR/WCAG21/' },
    { reference: 'accessibility contact email', id: '#accessibility-contact-email', url: 'mailto:morgan.dirodi@defra.gov.uk' }
  ])('%s link should be present with the correct attributes', (_reference, id, url) => {
    const link = $(id)

    expect(link).toBeDefined()
    expect(link.attr('href')).toBe(url)
  })
})
