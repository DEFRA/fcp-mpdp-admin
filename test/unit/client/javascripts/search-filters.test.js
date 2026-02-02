import { describe, beforeAll, beforeEach, afterEach, test, vi, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import searchFilters from '../../../../src/client/javascripts/search-filters.js'

const dom = new JSDOM()

describe('searchFilters', () => {
  let form
  let clearButton
  let checkboxes

  beforeAll(() => {
    global.window = dom.window
    global.document = dom.window.document
  })

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="search-form">
        <div data-module="search-filters">
          <button id="clear-all-filters" type="button">Clear All</button>
          <input type="checkbox" data-filter-checkbox="true" value="1" checked />
          <input type="checkbox" data-filter-checkbox="true" value="2" checked />
        </div>
      </form>
    `

    form = document.getElementById('search-form')
    clearButton = document.getElementById('clear-all-filters')
    checkboxes = Array.from(document.querySelectorAll('[data-filter-checkbox="true"]'))

    searchFilters.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  test('does nothing if no container found', () => {
    document.body.innerHTML = ''
    expect(() => searchFilters.init()).not.toThrow()
  })

  test('clear button unchecks all checkboxes and submits the form', () => {
    const submitSpy = vi.spyOn(form, 'submit')

    clearButton.click()

    checkboxes.forEach(cb => expect(cb.checked).toBe(false))
    expect(submitSpy).toHaveBeenCalled()
  })

  test('changing a filter checkbox submits the form', () => {
    const submitSpy = vi.spyOn(form, 'submit')

    checkboxes[0].checked = !checkboxes[0].checked
    checkboxes[0].dispatchEvent(new window.Event('change', { bubbles: true }))

    expect(submitSpy).toHaveBeenCalled()
  })
})
