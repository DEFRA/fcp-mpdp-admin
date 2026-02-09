import { expect } from 'vitest'
import { config } from '../../src/config/config.js'

const expectedHeaderLinks = [
  'https://www.gov.uk/',
  '/'
]

function expectedHeaderElement ($) {
  expect($('.govuk-header')).toBeDefined()
}

function expectHeaderLinks ($) {
  const headerLinks = []
  $('.govuk-header__link').each((_index, value) => {
    headerLinks.push($(value).attr('href'))
  })

  expect(
    expectedHeaderLinks.length === headerLinks.length &&
    expectedHeaderLinks.every(link => headerLinks.includes(link))
  ).toEqual(true)
}

function expectLinkText ($) {
  expect($('.govuk-header__logo a title').text()).toContain('GOV.UK')
  expect($('.govuk-header__service-name').text()).toMatch(config.get('serviceName'))
}

export function expectHeader ($) {
  expectedHeaderElement($)
  expectHeaderLinks($)
  expectLinkText($)
}
