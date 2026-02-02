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

describe('Privacy route', () => {
  let server
  let response
  let options
  let $

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    if (response) { return }

    options = getOptions('privacy', 'GET')

    response = await server.inject(options)
    $ = cheerio.load(response.payload)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should return status code 200  when hitting /privacy', async () => {
    expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })

  test('Check for common elements', () => {
    expectPageTitle($, 'Privacy notice')
    expectHeader($)
    expectPhaseBanner($)
    expectPageHeading($, 'Privacy notice')
    expectRelatedContent($, 'privacy')
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
    { reference: 'GOV.uk homepage', id: '#govuk-homepage-link', url: 'https://www.gov.uk/' },
    { reference: 'personal information charter', id: '#charter-link', url: 'https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs/about/personal-information-charter' },
    { reference: 'Defra helpline email', id: '#defra-helpline-email', url: 'mailto:defra.helpline@defra.gov.uk' },
    { reference: 'cookies homepage', id: '#cookies-homepage-link', url: 'https://www.gov.uk/help/cookies' },
    { reference: 'web browser', id: '#browsers-link', url: 'https://www.gov.uk/support/browsers' },
    { reference: 'European Economic Area (EEA)', id: '#eea-link', url: 'https://www.gov.uk/eu-eea' }
  ])('%s link should be present with the correct attributes', (_reference, id, url) => {
    const link = $(id)

    expect(link).toBeDefined()
    expect(link.attr('href')).toBe(url)
  })
})
