import { describe, beforeEach, test, expect, vi } from 'vitest'
import { initAll } from 'govuk-frontend'
import schemePaymentsByYear from '../../../../src/client/javascripts/scheme-payments-by-year.js'
import search from '../../../../src/client/javascripts/search.js'
import sortByDropdown from '../../../../src/client/javascripts/sort-by-dropdown.js'
import searchForm from '../../../../src/client/javascripts/search-form.js'
import searchFilters from '../../../../src/client/javascripts/search-filters.js'
import searchFilterTags from '../../../../src/client/javascripts/search-filter-tags.js'
import details from '../../../../src/client/javascripts/details.js'
import print from '../../../../src/client/javascripts/print.js'
import cookies from '../../../../src/client/javascripts/cookies.js'

vi.mock('govuk-frontend', () => ({
  initAll: vi.fn()
}))

vi.mock('../../../../src/client/javascripts/scheme-payments-by-year.js', () => ({
  default: { init: vi.fn() }
}))

vi.mock('../../../../src/client/javascripts/search.js', () => ({
  default: { init: vi.fn() }
}))

vi.mock('../../../../src/client/javascripts/sort-by-dropdown.js', () => ({
  default: { init: vi.fn() }
}))

vi.mock('../../../../src/client/javascripts/search-filters.js', () => ({
  default: { init: vi.fn() }
}))

vi.mock('../../../../src/client/javascripts/search-form.js', () => ({
  default: { init: vi.fn() }
}))

vi.mock('../../../../src/client/javascripts/search-filter-tags.js', () => ({
  default: { init: vi.fn() }
}))

vi.mock('../../../../src/client/javascripts/details.js', () => ({
  default: { init: vi.fn() }
}))

vi.mock('../../../../src/client/javascripts/print.js', () => ({
  default: { init: vi.fn() }
}))

vi.mock('../../../../src/client/javascripts/cookies.js', () => ({
  default: { init: vi.fn() }
}))

describe('Init client-side javascript', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await vi.importActual('../../../../src/client/javascripts/application.js')
  })

  test('should call init() on all custom client-side javascript modules', () => {
    expect(schemePaymentsByYear.init).toHaveBeenCalled()
    expect(search.init).toHaveBeenCalled()
    expect(sortByDropdown.init).toHaveBeenCalled()
    expect(searchFilters.init).toHaveBeenCalled()
    expect(searchForm.init).toHaveBeenCalled()
    expect(searchFilterTags.init).toHaveBeenCalled()
    expect(details.init).toHaveBeenCalled()
    expect(print.init).toHaveBeenCalled()
    expect(cookies.init).toHaveBeenCalled()
    expect(initAll).toHaveBeenCalled()
  })
})
