import { describe, beforeAll, beforeEach, afterEach, test, vi, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import sortByDropdown from '../../../../src/client/javascripts/sort-by-dropdown.js'

const dom = new JSDOM()

describe('sortByDropdown', () => {
  let form
  let dropdown

  beforeAll(() => {
    global.window = dom.window
    global.document = dom.window.document
  })

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="search-form">
        <select id="sort-by" name="sortBy" data-module="sort-by-dropdown">
          <option value="score">Score</option>
          <option value="date">Date</option>
        </select>
      </form>
    `

    form = document.getElementById('search-form')
    dropdown = document.querySelector('[data-module="sort-by-dropdown"]')

    sortByDropdown.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  test('does nothing if no dropdown found', () => {
    document.body.innerHTML = ''

    expect(() => sortByDropdown.init()).not.toThrow()
  })

  test('changing dropdown updates form value and submits the form', () => {
    const sortSelect = form.elements['sortBy']
    const submitSpy = vi.spyOn(form, 'submit').mockImplementation(() => { })

    console.log('form.sortBy:', form.sortBy)
    console.log('form.elements.sortBy:', form.elements.sortBy)
    console.log('form.elements["sortBy"]:', form.elements['sortBy'])

    dropdown.value = 'date'
    dropdown.dispatchEvent(new window.Event('change', { bubbles: true }))

    expect(sortSelect.value).toBe('date')
    expect(submitSpy).toHaveBeenCalled()
  })

  test('does not submit if form is missing', () => {
    document.body.innerHTML = `
      <select id="sort-by" name="sortBy" data-module="sort-by-dropdown">
        <option value="score">Score</option>
        <option value="date">Date</option>
      </select>
    `

    const newDropdown = document.querySelector('[data-module="sort-by-dropdown"]')
    sortByDropdown.init()

    expect(() => {
      newDropdown.dispatchEvent(new window.Event('change', { bubbles: true }))
    }).not.toThrow()
  })
})
