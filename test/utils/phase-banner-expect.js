import { expect } from 'vitest'

export function expectPhaseBanner ($) {
  const phaseBanner = $('.govuk-phase-banner')
  const link = phaseBanner.find('.govuk-link')

  expect(phaseBanner.length).toEqual(1)
  expect($('.govuk-phase-banner__content__tag').text()).toMatch('Beta')
  expect($('.govuk-phase-banner__text').text()).toMatch('This is a new service. Help us improve it and give your feedback (opens in new tab).')
  expect(link.attr('href')).toMatch('https://defragroup.eu.qualtrics.com/jfe/form/SV_1FcBVO6IMkfHmbs')
}
