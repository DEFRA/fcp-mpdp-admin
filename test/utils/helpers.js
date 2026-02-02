function getOptions (page, method = 'GET', params = {}, listParams = {}) {
  const urlParams = new URLSearchParams(params)
  for (const key in listParams) {
    listParams[key].forEach(value => {
      urlParams.append(key, value)
    })
  }

  return {
    method,
    url: `/${page}?${urlParams.toString()}`
  }
}

function getUniqueFields (searchResults, field) {
  return Array.from(new Set(searchResults.map((searchResult) => searchResult[field])))
}

function getFilterOptions (searchResults) {
  if (!searchResults?.length) {
    return { schemes: [], counties: [], years: [] }
  }

  return {
    schemes: getUniqueFields(searchResults, 'scheme'),
    counties: getUniqueFields(searchResults, 'county_council'),
    years: getUniqueFields(searchResults, 'year')
  }
}

function filterBySchemes (results, schemes) {
  if (!schemes?.length) {
    return results
  }

  return results.filter(result => schemes.includes(result.scheme))
}

function filterByCounties (results, counties) {
  if (!counties?.length) {
    return results
  }

  return results.filter(result => counties.includes(result.county_council))
}

function filterByYears (results, years) {
  if (!years?.length) {
    return results
  }

  return results.filter(result => years.includes(result.financial_year))
}

function removeFilterFields (searchResults) {
  return searchResults.map(({ scheme, ...rest }) => rest)
}

export {
  getOptions,
  getFilterOptions,
  filterBySchemes,
  filterByCounties,
  filterByYears,
  removeFilterFields
}
