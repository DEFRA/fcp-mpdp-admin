import { describe, beforeAll, beforeEach, afterEach, test, vi, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import searchFilterTags from '../../../../src/client/javascripts/search-filter-tags.js'

const dom = new JSDOM()

describe('searchFilterTags', () => {
  let form
  let button
  let checkbox

  beforeAll(() => {
    global.window = dom.window
    global.document = dom.window.document
  })

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="search-form">
        <input type="checkbox" name="filter1" value="value1" checked />
        <input type="checkbox" name="filter2" value="value2" checked />
        <button type="button" data-module="search-filter-tags" data-filter-value="value1">Remove Filter 1</button>
        <button type="button" data-module="search-filter-tags" data-filter-value="value2">Remove Filter 2</button>
      </form>
    `

    form = document.getElementById('search-form')
    button = document.querySelector('[data-filter-value="value1"]')
    checkbox = form.querySelector('input[type="checkbox"][value="value1"]')

    searchFilterTags.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  test('does nothing if no buttons are found', () => {
    document.body.innerHTML = ''

    expect(() => searchFilterTags.init()).not.toThrow()
  })

  test('clicking a filter button unchecks the correct checkbox and submits the form', () => {
    const submitSpy = vi.spyOn(form, 'submit').mockImplementation(() => {})

    expect(checkbox.checked).toBe(true)

    button.click()

    expect(checkbox.checked).toBe(false)
    expect(submitSpy).toHaveBeenCalled()
  })

  test('clicking a button does not throw if form is missing', () => {
    document.body.innerHTML = `
      <button type="button" data-module="search-filter-tags" data-filter-value="value1">Remove Filter 1</button>
    `

    const newButton = document.querySelector('[data-filter-value="value1"]')
    searchFilterTags.init()

    expect(() => newButton.click()).not.toThrow()
  })

  test('clicking a button does not throw if the target checkbox is missing', () => {
    document.body.innerHTML = `
      <form id="search-form">
        <button type="button" data-module="search-filter-tags" data-filter-value="missing">Remove Filter</button>
      </form>
    `

    const newButton = document.querySelector('[data-filter-value="missing"]')
    searchFilterTags.init()

    expect(() => newButton.click()).not.toThrow()
  })
})
