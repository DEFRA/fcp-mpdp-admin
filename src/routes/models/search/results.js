import { config } from '../../../config/config.js'
import { fetchPaymentData } from '../../../services/fetch-payment-data.js'
import staticCounties from '../../../data/filters/counties.js'
import staticYears from '../../../data/filters/years.js'
import { sortByItems } from '../../../data/sort-by-items.js'
import { getAllSchemeNames } from '../../../common/utils/get-all-scheme-names.js'
import { getRelatedContentLinks } from '../../../common/utils/related-content.js'

function getTags (query, { counties }) {
  const tags = {
    Scheme: getAllSchemeNames().reduce((acc, scheme) => {
      if (query.schemes?.toString().toLowerCase().split(',').includes(scheme.toLowerCase())) {
        acc.push({
          text: scheme,
          value: scheme
        })
      }

      return acc
    }, []),
    Year: staticYears.reduce((acc, year) => {
      if (query.years?.includes(year)) {
        acc.push({
          text: `20${year.slice(0, 2)} to 20${year.slice(3, 5)}`,
          value: year
        })
      }

      return acc
    }, []),
    County: getCounties(counties).reduce((acc, county) => {
      if (isChecked(query.counties, county)) {
        acc.push({
          text: county,
          value: county
        })
      }

      return acc
    }, [])
  }

  for (const key in tags) {
    if (tags[key].length === 0) {
      delete tags[key]
    }
  }

  return tags
}

function getFilters (query, filterOptions) {
  let schemesLength = 0
  if (query.schemes) {
    schemesLength = typeof query.schemes === 'string' ? 1 : query.schemes?.length
  }

  let yearsLength = 0
  if (query.years) {
    yearsLength = typeof query.years === 'string' ? 1 : query.years?.length
  }

  let countiesLength = 0
  if (query.counties) {
    countiesLength = typeof query.counties === 'string' ? 1 : query.counties?.length
  }

  const attributes = {
    onchange: 'this?.form?.submit()'
  }

  return {
    schemes: {
      name: 'Scheme',
      items: getSchemes(filterOptions.schemes).map(scheme => ({
        text: scheme,
        value: scheme,
        checked: isChecked(query.schemes, scheme),
        attributes
      })),
      selected: schemesLength
    },
    years: {
      name: 'Year',
      items: getYears(filterOptions.years).map(year => ({
        text: `20${year.slice(0, 2)} to 20${year.slice(3, 5)}`,
        value: year,
        checked: isChecked(query.years, year),
        attributes
      })),
      selected: yearsLength
    },
    counties: {
      name: 'County',
      items: getCounties(filterOptions.counties).filter((county) => county !== 'None').map((county) => ({
        text: county,
        value: county,
        checked: isChecked(query.counties, county),
        attributes
      })),
      selected: countiesLength
    }
  }
}

const getSchemes = schemes => schemes?.length ? schemes : getAllSchemeNames()

const getYears = years => (years?.length ? years : staticYears)

const getCounties = counties => counties?.length ? counties.sort((a, b) => a.localeCompare(b)) : staticCounties

const isChecked = (field, value) => (typeof field === 'string') ? field?.toLowerCase() === value?.toLowerCase() : field?.find(x => x.toLowerCase() === value.toLowerCase())

function getSortByModel (query) {
  return {
    selected: decodeURIComponent(query.sortBy),
    items: sortByItems
  }
}

function getPaginationAttributes (totalResults, requestedPage, searchString, filterBy, sortBy) {
  const encodedSearchString = encodeURIComponent(searchString)
  const totalPages = Math.ceil(totalResults / config.get('search.limit'))

  let prevHref = `/results?searchString=${encodedSearchString}&page=${requestedPage - 1}`
  let nextHref = `/results?searchString=${encodedSearchString}&page=${requestedPage + 1}`
  for (const key in filterBy) {
    if (filterBy[key].length) {
      const urlParam = `&${key}=`
      const urlPart = `${urlParam}${filterBy[key].map(x => encodeURIComponent(x)).join(urlParam)}`
      prevHref += urlPart
      nextHref += urlPart
    }
  }

  if (sortBy) {
    const encodedSortBy = encodeURIComponent(sortBy)
    prevHref += `&sortBy=${encodedSortBy}`
    nextHref += `&sortBy=${encodedSortBy}`
  }

  const previous = requestedPage <= 1
    ? null
    : {
        href: prevHref,
        labelText: `${requestedPage - 1} of ${totalPages} `,
        attributes: {
          id: 'prevOption',
          'aria-label': 'Go to previous page of results: ' + `${requestedPage - 1} of ${totalPages} `
        }
      }

  const next = totalPages <= 1 || totalPages === requestedPage
    ? null
    : {
        href: nextHref,
        labelText: `${requestedPage + 1} of ${totalPages} `,
        attributes: {
          id: 'next-option',
          'aria-label': 'Go to next page of results: ' + `${requestedPage + 1} of ${totalPages} `
        }
      }

  return { previous, next }
}

function getDownloadResultsLink (searchString, filterBy, sortBy) {
  const encodedSearchString = encodeURIComponent(searchString)
  let downloadResultsLink = `/results/file?searchString=${encodedSearchString}`
  for (const key in filterBy) {
    if (filterBy[key].length) {
      const urlParam = `&${key}=`
      const urlPart = `${urlParam}${filterBy[key].map(x => encodeURIComponent(x)).join(urlParam)}`
      downloadResultsLink += urlPart
    }
  }
  if (sortBy) {
    const encodedSortBy = encodeURIComponent(sortBy)
    downloadResultsLink += `&sortBy=${encodedSortBy}`
  }

  return { downloadResultsLink }
}

async function performSearch (searchString, requestedPage, filterBy, sortBy) {
  const offset = (requestedPage - 1) * config.get('search.limit')
  const paymentData = await fetchPaymentData(searchString, offset, filterBy, sortBy)
  const results = paymentData.results?.map(({ total_amount, ...x }) => x) // eslint-disable-line camelcase

  return {
    ...paymentData,
    results
  }
}

export async function resultsModel (request, error) {
  const { query } = request
  const searchString = decodeURIComponent(query.searchString)
  const referer = query.referer || request.headers.referer

  const defaultReturn = {
    hiddenInputs: [
      { id: 'page-id', name: 'pageId', value: 'results' },
      { id: 'sort-by', name: 'sortBy', value: 'score' },
      { id: 'referer', name: 'referer', value: referer }
    ],
    sortBy: getSortByModel(query)
  }

  if (error) {
    return {
      ...defaultReturn,
      relatedContentLinks: getRelatedContentLinks('search'),
      referer,
      filters: getFilters(query, {
        schemes: getAllSchemeNames(),
        years: staticYears,
        counties: staticCounties
      }),
      tags: getTags(query, {}),
      errorList: [{
        text: 'Enter a name or location',
        href: '#search-input'
      }],
      headingTitle: `Results for ‘${searchString}’`,
      total: 0
    }
  }

  const sortBy = decodeURIComponent(query.sortBy)
  const requestedPage = query.page
  const filterBy = {
    schemes: typeof query.schemes === 'string' ? [query.schemes] : query.schemes,
    years: typeof query.years === 'string' ? [query.years] : query.years,
    counties: typeof query.counties === 'string' ? [query.counties] : query.counties
  }

  const { results, total, filterOptions } = await performSearch(searchString, requestedPage, filterBy, sortBy)

  return {
    ...defaultReturn,
    searchString,
    ...getPaginationAttributes(total, requestedPage, searchString, filterBy, sortBy),
    filters: getFilters(query, filterOptions),
    tags: getTags(query, filterOptions),
    results,
    total,
    currentPage: requestedPage,
    headingTitle: `${total ? 'Results for' : 'We found no results for'} ‘${searchString}’`,
    ...getDownloadResultsLink(searchString, filterBy, sortBy)
  }
}
