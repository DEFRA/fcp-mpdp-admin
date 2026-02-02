import { describe, beforeAll, beforeEach, afterEach, test, vi, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import searchForm from '../../../../src/client/javascripts/search-form.js'

const dom = new JSDOM()

describe('searchForm', () => {
  let form
  let button
  let checkboxes

  beforeAll(() => {
    global.window = dom.window
    global.document = dom.window.document
  })

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="search-form">
        <input type="checkbox" name="filter1" checked />
        <input type="checkbox" name="filter2" checked />
        <button id="search-button" type="submit">Search</button>
      </form>
    `

    form = document.getElementById('search-form')
    button = document.getElementById('search-button')
    checkboxes = form.querySelectorAll('input[type="checkbox"]')

    searchForm.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  test('does nothing if no form or button found', () => {
    document.body.innerHTML = ''

    expect(() => searchForm.init()).not.toThrow()
  })

  test('clicking search button unchecks all checkboxes', () => {
    checkboxes.forEach(box => expect(box.checked).toBe(true))

    button.click()

    checkboxes.forEach(box => expect(box.checked).toBe(false))
  })

  test('does not throw if form is missing but button exists', () => {
    document.body.innerHTML = `
      <button id="search-button">Search</button>
    `

    const newButton = document.getElementById('search-button')

    expect(() => searchForm.init()).not.toThrow()
    expect(() => newButton.click()).not.toThrow()
  })

  test('does not throw if button is missing but form exists', () => {
    document.body.innerHTML = `
      <form id="search-form">
        <input type="checkbox" name="filter1" checked />
      </form>
    `

    expect(() => searchForm.init()).not.toThrow()
  })
})
