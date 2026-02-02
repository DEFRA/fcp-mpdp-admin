import { config } from '../config/config.js'
import { post } from '../api/post.js'

export async function fetchPaymentData (
  searchString,
  offset,
  filterBy,
  sortBy,
  action,
  limit = config.get('search.limit')
) {
  const response = await post('', {
    searchString,
    limit,
    offset,
    filterBy,
    sortBy,
    action
  })

  if (!response) {
    return {
      results: [],
      total: 0,
      filterOptions: {
        schemes: [],
        years: [],
        countries: []
      }
    }
  }

  const result = JSON.parse(response.payload)

  return {
    results: result.rows,
    total: result.count,
    filterOptions: result.filterOptions
  }
}
