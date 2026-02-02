import { describe, afterAll, beforeAll, beforeEach, test, vi, expect } from 'vitest'
import http2 from 'node:http2'
import search from '../../../../src/client/javascripts/search.js'
import { JSDOM } from 'jsdom'

const { constants: httpConstants } = http2
const dom = new JSDOM()

describe('search', () => {
  let searchInput
  let domSuggestions

  beforeAll(() => {
    global.document = dom.window.document
    global.window = dom.window
  })

  beforeEach(() => {
    document.body.innerHTML = `
      <input type="text" id="search-input" tabIndex="1" />
      <div id="suggestions"></div>
      <button id="search-button">Search</button>
    `

    search.init()
    searchInput = document.getElementById('search-input')
    domSuggestions = document.getElementById('suggestions')
  })

  describe('constructor', () => {
    test('should initialise with the correct default values', () => {
      expect(search.loadingText).toBe('Loading...')
      expect(search.noResultsText).toBe('No results found')
    })

    test('should call setupSearch and set up the searchInput and domSuggestions', () => {
      expect(search.searchInput).toBe(searchInput)
      expect(search.domSuggestions).toBe(domSuggestions)
    })

    test('should not proceed with the rest of the constructor if searchInput or domSuggestions is missing', () => {
      document.body.innerHTML = '<input type="text" id="some-other-input" />'
      search.init()

      expect(search.searchInput).toBeNull()
      expect(search.domSuggestions).toBeNull()
    })
  })

  describe('getSearchSuggestions', () => {
    test('should resolve with search suggestions when successful', async () => {
      const mockMakeSearchRequest = vi.spyOn(search, 'makeSearchRequest').mockImplementationOnce((searchString, callback) => {
        callback(null, { suggestions: ['suggestion1', 'suggestion2'] })
      })

      const result = await search.getSearchSuggestions(encodeURIComponent('test'))

      expect(result).toEqual({ suggestions: ['suggestion1', 'suggestion2'] })
      expect(mockMakeSearchRequest).toHaveBeenCalledWith('test', expect.any(Function))
    })

    test('should reject with an error when unsuccessful', async () => {
      const error = new Error(`Request failed with status ${httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR}: Search request failed`)
      error.status = httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR
      error.statusText = 'Search request failed'

      const mockMakeSearchRequest = vi.spyOn(search, 'makeSearchRequest').mockImplementationOnce((searchString, callback) => {
        callback(error)
      })

      await expect(search.getSearchSuggestions(encodeURIComponent('test'))).rejects.toThrow('Request failed with status 500: Search request failed')

      expect(mockMakeSearchRequest).toHaveBeenCalledWith('test', expect.any(Function))
    })
  })

  describe('makeSearchRequest', () => {
    test('should call XMLHttpRequest with correct parameters', async () => {
      const xhrMock = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn()
      }

      vi.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock)

      const searchString = encodeURIComponent('test')
      const callback = vi.fn()

      search.makeSearchRequest(searchString, callback)

      expect(xhrMock.open).toHaveBeenCalledWith('GET', `/suggestions?searchString=${searchString}`, true)
      expect(xhrMock.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
      expect(xhrMock.send).toHaveBeenCalledWith(JSON.stringify({
        searchString
      }))
    })

    test('should callback successfully with correct parameters', async () => {
      const response = {
        rows: [
          {
            payee_name: 'test',
            town: 'test',
            county_council: 'test',
            part_postcode: 'test'
          }
        ]
      }

      const xhrMock = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(function () { this.onload() }),
        status: httpConstants.HTTP_STATUS_OK,
        response: JSON.stringify(response)
      }

      vi.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock)

      const searchString = encodeURIComponent('test')
      const callback = vi.fn()

      search.makeSearchRequest(searchString, callback)

      expect(callback).toHaveBeenCalledWith(null, response)
    })

    test('should callback with an error with error code after loading', async () => {
      const xhrMock = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(function () { this.onload() }),
        status: httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
        statusText: 'error'
      }

      vi.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock)

      const searchString = encodeURIComponent('test')
      const callback = vi.fn()

      search.makeSearchRequest(searchString, callback)

      // Expect the callback to be called with a proper Error object
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        message: `Request failed with status ${httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR}: error`,
        status: httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
        statusText: 'error'
      }))
    })

    test('should callback with an error with error code if there was an error', async () => {
      const xhrMock = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(function () { this.onerror() }),
        status: httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
        statusText: 'error'
      }

      vi.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock)

      const searchString = encodeURIComponent('test')
      const callback = vi.fn()

      search.makeSearchRequest(searchString, callback)

      // Expect the callback to be called with a proper Error object
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        message: `Request failed with status ${httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR}: error`,
        status: httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
        statusText: 'error'
      }))
    })
  })

  describe('getOption', () => {
    test('should create a div with specified properties', () => {
      const mockClick = vi.fn()
      const mockMouseOver = vi.fn()
      const option = search.getOption(
        'value',
        'text',
        mockClick,
        mockMouseOver,
        'test-class'
      )

      expect(option.value).toBe('value')
      expect(option.textContent).toBe('text')
      expect(option.classList.contains('test-class')).toBe(true)

      option.onmousedown()
      option.onmouseover()

      expect(mockClick).toHaveBeenCalled()
      expect(mockMouseOver).toHaveBeenCalled()
    })

    test('should handle optional parameters', () => {
      const option = search.getOption('value', 'text', vi.fn())

      expect(option.onmouseover).toBe(null)
      expect(option.classList.length).toBe(0)
    })
  })

  describe('loadingOption', () => {
    test('should return a DIV with the expect text and value', () => {
      const loadingOption = search.loadingOption()

      expect(loadingOption.value).toBe(search.loadingText)
    })
  })

  describe('noResultsOption', () => {
    test('should return a DIV with the expect text and value', () => {
      const noResultsOption = search.noResultsOption()

      expect(noResultsOption.value).toBe(search.noResultsText)
    })
  })

  describe('viewAllOption', () => {
    test('should create a view all option with correct text', () => {
      const numResults = 5

      const option = search.viewAllOption(numResults)

      expect(option.textContent).toBe(`View all (${numResults} results)`)
      expect(option.classList.contains('mpdp-text-align-center')).toBe(true)
    })

    test('should correctly handle singular result', () => {
      const option = search.viewAllOption(1)

      expect(option.textContent).toBe('View all (1 result)')
    })
  })

  describe('hideSuggestions', () => {
    test('should hide the suggestions and reset focusIndex', () => {
      search.hideSuggestions()

      expect(domSuggestions.style.display).toBe('none')
      expect(search.focusIndex).toBe(-1)
    })
  })

  describe('showSuggestions', () => {
    test('should display the suggestions', () => {
      search.showSuggestions()

      expect(domSuggestions.style.display).toBe('block')
    })
  })

  describe('loadSuggestions', () => {
    test('should display suggestions if results are found', async () => {
      const mockSuggestions = {
        count: 2,
        rows: [
          {
            payee_name: 'Payee 1',
            town: 'Town1',
            county_council: 'Council1',
            part_postcode: 'P1'
          },
          {
            payee_name: 'Payee 2',
            town: 'Town2',
            county_council: 'Council2',
            part_postcode: 'P2'
          }
        ]
      }

      search.getSearchSuggestions = vi
        .fn()
        .mockResolvedValueOnce(mockSuggestions)

      await search.loadSuggestions()

      expect(domSuggestions.innerHTML).toContain(
        'Payee 1 (Town1, Council1, P1)'
      )

      expect(domSuggestions.innerHTML).toContain(
        'Payee 2 (Town2, Council2, P2)'
      )
    })
  })

  describe('setActive and unsetActive', () => {
    beforeEach(() => {
      domSuggestions.innerHTML = `
        <div value="1" class="option">Option 1</div>
        <div value="2" class="option">Option 2</div>
      `
    })

    test('should set the active class on the focused option', () => {
      search.focusIndex = 1
      search.setActive()

      expect(domSuggestions.children[1].classList).toContain('active')
    })

    test('should unset the active class on all options', () => {
      domSuggestions.children[1].classList.add('active')
      search.unsetActive()

      for (const child of domSuggestions.children) {
        expect(child.classList).not.toContain('active')
      }
    })

    test('should set the focusIndex to 1 if it goes below 0', () => {
      search.focusIndex = -1
      search.setActive()

      expect(search.focusIndex).toBe(1)
    })

    test('should set the focusIndex to 0 if it goes above the number of DOM children', () => {
      search.focusIndex = 2
      search.setActive()

      expect(search.focusIndex).toBe(0)
    })

    test('should return without making any children active if the current child has loading text', () => {
      domSuggestions.innerHTML = `
        <div class="mpdp-text-colour-dark-grey" value="${search.loadingText}">${search.loadingText}</div>
      `

      search.focusIndex = 0
      search.setActive()

      for (const child of domSuggestions.children) {
        expect(child.classList).not.toContain('active')
      }
    })

    test('should return without making any children active if the current child has no results text', () => {
      domSuggestions.innerHTML = `
        <div class="mpdp-text-colour-dark-grey" value="${search.noResultsText}">${search.noResultsText}</div>
      `

      search.focusIndex = 0
      search.setActive()

      for (const child of domSuggestions.children) {
        expect(child.classList).not.toContain('active')
      }
    })
  })

  describe('addSearchInputListeners', () => {
    beforeAll(() => {
      vi.useFakeTimers()
    })

    afterAll(() => {
      vi.useRealTimers()
    })

    test('should hide suggestions when the search input is blurred', () => {
      const hideSuggestionsSpy = vi.spyOn(search, 'hideSuggestions')
      const timeoutSpy = vi.spyOn(window, 'setTimeout')
      searchInput.dispatchEvent(new window.Event('blur', { bubbles: true }))

      expect(timeoutSpy).toHaveBeenCalled()

      vi.runAllTimers()

      expect(hideSuggestionsSpy).toHaveBeenCalled()
    })

    test('should hide suggestions when input length is less than minCharLength', () => {
      searchInput.value = 'te'
      const hideSuggestionsSpy = vi.spyOn(search, 'hideSuggestions')
      searchInput.dispatchEvent(new window.Event('input', { bubbles: true }))

      expect(hideSuggestionsSpy).toHaveBeenCalled()
    })

    test('should hide suggestions when input length equals the minCharLength but has a leading space', () => {
      searchInput.value = ' te'
      const hideSuggestionsSpy = vi.spyOn(search, 'hideSuggestions')
      searchInput.dispatchEvent(new window.Event('input', { bubbles: true }))

      expect(hideSuggestionsSpy).toHaveBeenCalled()
    })

    test('should hide suggestions when input length equals the minCharLength but has a trailing space', () => {
      searchInput.value = 'te '
      const hideSuggestionsSpy = vi.spyOn(search, 'hideSuggestions')
      searchInput.dispatchEvent(new window.Event('input', { bubbles: true }))

      expect(hideSuggestionsSpy).toHaveBeenCalled()
    })

    test('should call loadSuggestions when input length is sufficient', () => {
      searchInput.value = 'test'
      const loadSuggestionsSpy = vi.spyOn(search, 'loadSuggestions')
      searchInput.dispatchEvent(new window.Event('input'))

      expect(loadSuggestionsSpy).toHaveBeenCalled()
    })

    test('should navigate through options on arrow key presses', () => {
      domSuggestions.innerHTML = `
                <div value="1" class="option">Option 1</div>
                <div value="2" class="option">Option 2</div>
            `
      const downEvent = new window.KeyboardEvent('keydown', { key: 'Down' })
      const upEvent = new window.KeyboardEvent('keydown', { key: 'Up' })

      searchInput.dispatchEvent(downEvent)
      expect(search.focusIndex).toBe(0)

      searchInput.dispatchEvent(upEvent)
      expect(search.focusIndex).toBe(1)
    })

    test('should hide suggestions on Escape key press', () => {
      const hideSuggestionsSpy = vi.spyOn(search, 'hideSuggestions')
      const escapeEvent = new window.KeyboardEvent('keydown', { key: 'Escape' })

      searchInput.dispatchEvent(escapeEvent)

      expect(hideSuggestionsSpy).toHaveBeenCalled()
    })

    test('should trigger search button click on Enter key press', () => {
      const spy = vi.spyOn(document.getElementById('search-button'), 'click')
      const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' })

      searchInput.dispatchEvent(enterEvent)

      expect(spy).toHaveBeenCalled()
    })

    test('should do nothing if the the option has Loading text', () => {
      domSuggestions.innerHTML = `
        <div class="mpdp-text-colour-dark-grey" value="test">${search.loadingText}</div>
      `
      search.focusIndex = 0
      const spy = vi.spyOn(domSuggestions.children[0], 'click')
      const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' })

      searchInput.dispatchEvent(enterEvent)

      expect(spy).not.toHaveBeenCalled()
    })
  })
})
