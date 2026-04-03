import { expect } from 'vitest'

function expectedHeaderElement ($) {
  expect($('.govuk-header')).toBeDefined()
}

export function expectHeader ($) {
  expectedHeaderElement($)
}
