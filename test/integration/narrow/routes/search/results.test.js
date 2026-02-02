import { describe, beforeAll, beforeEach, afterAll, test, expect, vi } from 'vitest'
import * as cheerio from 'cheerio'
import http2 from 'node:http2'
import { createServer } from '../../../../../src/server.js'
import {
  getOptions,
  getFilterOptions,
  filterBySchemes,
  filterByCounties,
  filterByYears,
  removeFilterFields
} from '../../../../utils/helpers.js'
import { mockResults } from '../../../../data/mock-results.js'
import { expectPageTitle } from '../../../../utils/page-title-expect.js'
import { expectHeader } from '../../../../utils/header-expect.js'
import { expectPhaseBanner } from '../../../../utils/phase-banner-expect.js'
import { expectBackLink } from '../../../../utils/back-link-expect.js'
import { expectPageHeading } from '../../../../utils/page-heading-expect.js'
import { expectTags } from '../../../../utils/tags-expect.js'
import { expectFooter } from '../../../../utils/footer-expect.js'

const { constants: httpConstants } = http2

vi.mock('../../../../../src/services/fetch-payment-data.js', () => ({
  fetchPaymentData: (searchQuery, offset = 0, filterBy = {}, sortBy = 'score', limit = 20, page = 1) => {
    let searchResults = mockResults.filter(searchResult =>
      searchResult.payee_name.toLowerCase().includes(searchQuery.toLowerCase()))

    const filterOptions = getFilterOptions(searchResults)

    searchResults = filterBySchemes(searchResults, filterBy.schemes)
    searchResults = filterByCounties(searchResults, filterBy.counties)
    searchResults = filterByYears(searchResults, filterBy.years)

    let results = removeFilterFields(searchResults)

    if (!results) {
      return {
        results: [],
        total: 0,
        filterOptions: []
      }
    }

    const keys = [
      'payee_name',
      'part_postcode',
      'town',
      'county_council'
    ]

    if (keys.includes(sortBy)) {
      results = results.sort((r1, r2) => r1[sortBy] > r2[sortBy] ? 1 : -1)
    }

    return {
      results: results.slice(offset, offset + limit),
      total: results.length,
      filterOptions
    }
  }
}))

describe('Results route', () => {
  let searchString
  let server
  let response
  let options
  let $

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    searchString = 'Sons'
    options = getOptions('results', 'GET', { searchString })
    response = await server.inject(options)
    $ = cheerio.load(response.payload)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /results renders with valid query parameters returns results page', () => {
    beforeEach(async () => {
      options = getOptions('results', 'GET', { searchString })
      response = await server.inject(options)
      $ = cheerio.load(response.payload)
    })

    test('Should return status code 200 when hitting /results', () => {
      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('Should render common elements', () => {
      expectPageTitle($, `Results for ‘${searchString}’`)
      expectHeader($)
      expectPhaseBanner($)
      expectBackLink($, '/search', 'Back')
      expectPageHeading($, `Results for ‘${searchString}’`)
      expectFooter($)
    })

    test('Search box is present on results page', () => {
      const searchButton = $('.govuk-button')
      const searchBox = $('#results-search-input')

      expect(searchButton).toBeDefined()
      expect(searchButton.text()).toMatch('Search')

      expect(searchBox).toBeDefined()
      expect(searchBox.val()).toMatch(searchString)
    })

    test('Next button on pagination is present on the results page', () => {
      const nextButton = $('#next-option')

      expect(nextButton).toBeDefined()
    })

    test('Results are displayed on the page up to a limit of 20', () => {
      const resultElements = $('.govuk-link.govuk-link--no-visited-state')

      expect(resultElements.length).toBe(20)
    })

    test('Total results show the real number', () => {
      const filteredResults = mockResults.filter(mockResult =>
        mockResult.payee_name.toLowerCase().includes(searchString.toLowerCase())
      )

      expect($('#total-results').text()).toMatch(`${filteredResults.length} results`)
    })
  })

  describe('GET /results renders with pagination returns new results with each page', () => {
    beforeEach(async () => {
      searchString = 'Sons'

      options = getOptions(
        'results',
        'GET',
        {
          searchString,
          page: 2
        }
      )

      response = await server.inject(options)
      $ = cheerio.load(response.payload)
    })

    test('Search returns status code 200', () => {
      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_OK)
    })

    test('Should render page heading with searchString', () => {
      expectPageHeading($, `Results for ‘${searchString}’`)
    })

    test('Search box is present on results page', () => {
      const searchButton = $('.govuk-button')
      const searchBox = $('#results-search-input')

      expect(searchButton).toBeDefined()
      expect(searchButton.text()).toMatch('Search')

      expect(searchBox).toBeDefined()
      expect(searchBox.val()).toMatch(searchString)
    })

    test('Next and previous buttons on pagination is present on the results page', () => {
      const nextButton = $('#next-option')
      const previousButton = $('#prev-option')

      expect(nextButton).toBeDefined()
      expect(previousButton).toBeDefined()
    })

    test('Page 2 only shows the last 3 results from the mock results', () => {
      const resultElements = $('.govuk-link.govuk-link--no-visited-state')

      expect(resultElements.length).toBe(3)
    })

    test('Total results show the real number', () => {
      const filteredResults = mockResults.filter(x =>
        x.payee_name.toLowerCase().includes(searchString.toLowerCase())
      )

      expect($('#total-results').text()).toMatch(`${filteredResults.length} results`)
    })
  })

  describe('GET /results renders when there are no search results', () => {
    beforeEach(async () => {
      searchString = '__INVALID_SEARCH_STRING__'

      options = getOptions(
        'results',
        'GET',
        {
          searchString,
          page: 2
        }
      )

      response = await server.inject(options)
      $ = cheerio.load(response.payload)
    })

    test('Results page title and heading states no results with searchString', () => {
      expectPageTitle($, `We found no results for ‘${searchString}’`)
      expectPageHeading($, `We found no results for ‘${searchString}’`)
    })

    test('Search box is present on results page', () => {
      const searchButton = $('.govuk-button')
      const searchBox = $('#results-search-input')

      expect(searchButton).toBeDefined()
      expect(searchButton.text()).toMatch('Search')

      expect(searchBox).toBeDefined()
      expect(searchBox.val()).toMatch(searchString)
    })

    test('Total results show 0 results', () => {
      expect($('#total-results').text()).toMatch('0 results')
    })

    test('Shows no matching results message', () => {
      const noResults = $('#no-results')

      expect(noResults).toBeDefined()
      expect(noResults.text()).toMatch('There are no matching results')
    })

    test('Sort by dropdown is not shown to the user', () => {
      expect($('#sort-by-dropdown').length).toBe(0)
    })
  })

  describe('GET /results renders error message when searchString is empty', () => {
    beforeEach(async () => {
      searchString = ''
      const pageId = 'results'

      options = getOptions(
        'results',
        'GET',
        {
          searchString,
          pageId
        }
      )

      response = await server.inject(options)
      $ = cheerio.load(response.payload)
    })

    test('Results page title and heading shows empty string and error heading is displayed', () => {
      expectPageTitle($, `Results for ‘${searchString}’`)
      expectPageHeading($, `Results for ‘${searchString}’`)
      expect($('.govuk-error-summary__title').text()).toContain('There is a problem')
    })

    test('Search box is present and shows error', () => {
      const button = $('.govuk-button')
      const searchInputError = $('#search-input-error')
      const searchErrorBox = $('.govuk-input.govuk-input--error')

      expect(button).toBeDefined()
      expect(button.text()).toMatch('Search')

      expect(searchInputError).toBeDefined()
      expect(searchInputError.text()).toContain('Error: Enter a name or location')

      expect(searchErrorBox).toBeDefined()
      expect(searchErrorBox.val()).toMatch(searchString)
    })

    test('Total results show 0 results', () => {
      expect($('#total-results').text()).toMatch('0 results')
    })

    test('Shows no matching results message', () => {
      const noResults = $('#no-results')

      expect(noResults).toBeDefined()
      expect(noResults.text()).toMatch('There are no matching results')
    })

    test('Page title contains error text', () => {
      expectPageTitle($, 'Error: Results for ‘’')
    })

    test('Sort by dropdown is not shown to the user', () => {
      expect($('#sort-by-dropdown').length).toBe(0)
    })
  })

  describe('GET /results with sortBy parameter returns sorted results page', () => {
    beforeEach(async () => {
      searchString = 'Sons'
      const sortBy = 'score'

      options = getOptions(
        'results',
        'GET',
        {
          searchString,
          sortBy
        }
      )

      response = await server.inject(options)
      $ = cheerio.load(response.payload)
    })

    test('Should return status code 200 when hitting /results', () => {
      expect(response.statusCode).toBe(200)
    })

    test('Sort by dropdown is present on the results page', () => {
      const sortByDropdown = $('#sort-by-dropdown')

      expect(sortByDropdown).toBeDefined()
      expect(sortByDropdown.text()).toContain('Relevance')
      expect(sortByDropdown.text()).toContain('Payee name')
      expect(sortByDropdown.text()).toContain('Part postcode')
      expect(sortByDropdown.text()).toContain('Town')
      expect(sortByDropdown.text()).toContain('County council')
    })

    test('Results returns 20 rows', () => {
      const resultElements = $('.govuk-link.govuk-link--no-visited-state')
      expect(resultElements.length).toBe(20)
    })

    test.each([
      { test: 'relevance (score)', sortBy: 'score', topResult: 'T R Carter & Sons 1' },
      { test: 'payee name', sortBy: 'payee_name', topResult: 'Adan Brandt Sons' },
      { test: 'part postcode', sortBy: 'part_postcode', topResult: 'T R Carter & Sons 16' },
      { test: 'town', sortBy: 'town', topResult: 'T R Carter & Sons 22' },
      { test: 'county council', sortBy: 'county_council', topResult: 'T R Carter & Sons 10' },
    ])('Results are sorted by %s', async (_test, sortBy, topResult) => {
      options = getOptions(
        'results',
        'GET',
        {
          searchString,
          sortBy
        }
      )

      response = await server.inject(options)
      $ = cheerio.load(response.payload)

      const resultElements = $('.govuk-link.govuk-link--no-visited-state')
      const data = resultElements.first().text()

      expect(data).toMatch(topResult)
    })

    test('Results are sorted by relevance (score) when no sortBy is passed into query object', async () => {
      options = getOptions(
        'results',
        'GET',
        {
          searchString
        }
      )

      const resultElements = $('.govuk-link.govuk-link--no-visited-state')
      const data = resultElements.first().text()

      expect(data).toContain('T R Carter & Sons 1')
    })
  })

  describe('GET /results with schemes filter returns results filtered by schemes', () => {
    test('Results are filtered with single scheme in query params', async () => {
      const schemes = 'Sustainable Farming Incentive'

      options = getOptions(
        'results',
        'GET',
        {
          searchString,
          schemes
        }
      )

      response = await server.inject(options)
      const $ = cheerio.load(response.payload)
      const filteredResults = mockResults
        .filter(result => result.payee_name.toLowerCase().includes(searchString.toLowerCase()))
        .filter(result => result.scheme === schemes)

      $('a.govuk-link.govuk-link--no-visited-state').each((_i, element) => {
        const elementText = $(element).text().trim()
        expect(filteredResults.find(result => result.payee_name === elementText)).toBeDefined()
      })

      expect($('#total-results').text()).toMatch(`${filteredResults.length} results`)
      expectTags($, [schemes])
    })

    test('Results are filtered with multiple schemes in query params', async () => {
      const schemes = [
        'Sustainable Farming Incentive',
        'Farming Resilience Fund'
      ]

      options = getOptions(
        'results',
        'GET',
        { searchString },
        { schemes }
      )

      response = await server.inject(options)
      const $ = cheerio.load(response.payload)

      const dataMatchingSchemes = mockResults
        .filter(result => result.payee_name.toLowerCase().includes(searchString.toLowerCase()))
        .filter(result => schemes.includes(result.scheme))

      $('a.govuk-link.govuk-link--no-visited-state').each((_i, element) => {
        expect(dataMatchingSchemes.find(result => result.payee_name === $(element).text().trim())).toBeDefined()
      })

      expect($('#total-results').text()).toMatch(`${dataMatchingSchemes.length} results`)
      expectTags($, schemes)
    })
  })

  describe('GET /results with years filter returns results filtered by years', () => {
    test('Results are filtered with single year in query params', async () => {
      const schemes = 'Farming Resilience Fund'
      const years = '21/22'

      options = getOptions(
        'results',
        'GET',
        {
          searchString,
          schemes,
          years
        }
      )

      response = await server.inject(options)

      let filteredResults = mockResults.filter(result =>
        result.payee_name.toLowerCase().includes(searchString.toLowerCase()))
      filteredResults = filterBySchemes(filteredResults, [schemes])
      filteredResults = filterByYears(filteredResults, [years])

      $ = cheerio.load(response.payload)

      $('a.govuk-link.govuk-link--no-visited-state').each((_i, element) => {
        expect(filteredResults.find(result => result.payee_name === $(element).text().trim())).toBeDefined()
      })

      expect($('#total-results').text()).toMatch(`${filteredResults.length} results`)
      expectTags($, [schemes, `20${years.slice(0, 2)} to 20${years.slice(3, 5)}`])
    })

    test('Results are filtered with multiples years in query params', async () => {
      const schemes = ['Sustainable Farming Incentive', 'Farming Resilience Fund']
      const years = ['21/22', '22/23']

      options = getOptions(
        'results',
        'GET',
        { searchString },
        {
          schemes,
          years
        }
      )

      response = await server.inject(options)

      let filteredResults = mockResults.filter(result =>
        result.payee_name.toLowerCase().includes(searchString.toLowerCase()))
      filteredResults = filterBySchemes(filteredResults, schemes)
      filteredResults = filterByYears(filteredResults, years)

      $ = cheerio.load(response.payload)

      $('a.govuk-link.govuk-link--no-visited-state').each((_i, element) => {
        expect(filteredResults.find(result => result.payee_name === $(element).text().trim())).toBeDefined()
      })

      expect($('#total-results').text()).toMatch(`${filteredResults.length} results`)
    })
  })

  describe('GET /results with counties filter returns results filtered by counties', () => {
    test('Results are filtered with single county in query params', async () => {
      const schemes = 'Farming Resilience Fund'
      const counties = 'Durham, East'

      options = getOptions(
        'results',
        'GET',
        {
          searchString,
          schemes,
          counties
        }
      )

      response = await server.inject(options)

      let filteredResults = mockResults.filter(result =>
        result.payee_name.toLowerCase().includes(searchString.toLowerCase()))
      filteredResults = filterBySchemes(filteredResults, [schemes])
      filteredResults = filterByCounties(filteredResults, [counties])

      $ = cheerio.load(response.payload)

      $('a.govuk-link.govuk-link--no-visited-state').each((_i, element) => {
        expect(filteredResults.find(result => result.payee_name === $(element).text().trim())).toBeDefined()
      })

      expect($('#total-results').text()).toMatch(`${filteredResults.length} results`)
      expectTags($, [schemes, counties])
    })

    test('Results are filtered with multiple counties in query params', async () => {
      const schemes = ['Sustainable Farming Incentive', 'Farming Resilience Fund']
      const counties = ['Durham, East', 'Berkshire']

      options = getOptions(
        'results',
        'GET',
        { searchString },
        {
          schemes,
          counties
        }
      )

      response = await server.inject(options)

      let resultsMatchingSchemesAndCounties = mockResults.filter(result =>
        result.payee_name.toLowerCase().includes(searchString.toLowerCase()))
      resultsMatchingSchemesAndCounties = filterBySchemes(resultsMatchingSchemesAndCounties, schemes)
      resultsMatchingSchemesAndCounties = filterByCounties(resultsMatchingSchemesAndCounties, counties)

      $ = cheerio.load(response.payload)

      $('a.govuk-link.govuk-link--no-visited-state').each((_i, element) => {
        expect(resultsMatchingSchemesAndCounties.find(result => result.payee_name === $(element).text().trim())).toBeDefined()
      })

      expect($('#total-results').text()).toMatch(`${resultsMatchingSchemesAndCounties.length} results`)
    })
  })

  describe('GET /results fails & redirects gracefully when query is empty', () => {
    beforeEach(async () => {
      server = await createServer()
      await server.initialize()

      options = getOptions('results', 'GET')

      response = await server.inject(options)
      $ = cheerio.load(response.payload)
    })

    afterAll(async () => {
      await server.stop({ timeout: 0 })
    })

    test('renders the search/index view with error when query object is empty', async () => {
      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
      expect($('.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('.govuk-heading-l').text()).toContain('Search for an agreement holder')
      expect($('#search-input-error').text()).toContain('Error: Enter a name or location')
    })

    test('renders the search/index view with Joi error message if query string is invalid', async () => {
      options = getOptions('results', 'GET', { searchString: 'test', page: 'page-number' })
      response = await server.inject(options)
      $ = cheerio.load(response.payload)

      expect(response.statusCode).toBe(httpConstants.HTTP_STATUS_BAD_REQUEST)
      expect($('.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('.govuk-error-summary__list').text()).toMatch(/"page" must be a number/)
    })
  })

  describe('GET /results with single result shows "1 result" (not plural)', () => {
    test('"1 result" is displayed in total and download text', async () => {
      const searchString = 'T R Carter & Sons 22'

      options = getOptions(
        'results',
        'GET',
        {
          searchString
        }
      )

      response = await server.inject(options)
      $ = cheerio.load(response.payload)

      mockResults.filter(result => result.payee_name.includes(searchString))

      expect($('#total-results').text()).toMatch('1 result')
      expect($('#download-results-link').text()).toMatch('Download 1 result (.CSV)')
    })
  })

  test('Download all link is present on the results when there are no results to download', async () => {
    const searchString = 'Daughter'

    options = getOptions(
      'results',
      'GET',
      {
        searchString
      }
    )

    response = await server.inject(options)
    $ = cheerio.load(response.payload)

    const downloadAllLink = $('#download-all-scheme-payment-data-link')

    expect(downloadAllLink).toBeDefined()
    expect(downloadAllLink.text()).toMatch('download all scheme payment data (5.7MB)')
  })
})
