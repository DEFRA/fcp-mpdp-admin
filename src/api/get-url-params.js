export function getUrlParams (page, params = {}) {
  if (Object.keys(params).length === 0) {
    return `/${page}`
  }

  return `/${page}?${new URLSearchParams(params).toString()}`
}
