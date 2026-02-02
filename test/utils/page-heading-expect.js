import { expect } from 'vitest'

export function expectPageHeading ($, pageHeading) {
  expect($('h1').text()).toEqual(pageHeading)
}
