import { expect } from 'vitest'

const expectedFooterLinks = [
  '/privacy',
  '/cookies',
  '/accessibility',
  'https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs',
  'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
  'https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/'
]

export function expectFooter ($) {
  const footerLinks = []
  $('.govuk-footer__link').each((_index, value) => {
    footerLinks.push($(value).attr('href'))
  })

  expect(
    expectedFooterLinks.length === footerLinks.length &&
    expectedFooterLinks.every(link => footerLinks.includes(link))
  ).toEqual(true)
}
