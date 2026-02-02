import { expect } from 'vitest'

export function expectBackLink ($, href, text) {
  const backLink = $('.govuk-back-link')

  expect(backLink).toBeDefined()
  expect(backLink.text()).toMatch(text)
  expect(backLink.attr('href')).toBe(href)
}
