import { getUrlParams } from '../api/get-url-params.js'
import { get } from '../api/get.js'

export async function fetchSearchSuggestions (searchString) {
  const url = getUrlParams('search', {
    searchString
  })

  const response = await get(url)

  if (!response) {
    return { rows: [], count: 0 }
  }

  return JSON.parse(response.payload)
}
