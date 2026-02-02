export default {
  init () {
    const dropdown = document.querySelector('[data-module="sort-by-dropdown"]')

    if (!dropdown) { return }

    dropdown.addEventListener('change', (event) => {
      const searchForm = document.getElementById('search-form')
      if (!searchForm) { return }
      searchForm.elements.sortBy.value = event.target.value
      searchForm.submit()
    })
  }
}
