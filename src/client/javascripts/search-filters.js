export default {
  init () {
    const filtersContainer = document.querySelector('[data-module="search-filters"]')

    if (!filtersContainer) { return }

    const form = filtersContainer.closest('form')

    const clearButton = filtersContainer.querySelector('#clear-all-filters')
    if (clearButton && form) {
      clearButton.addEventListener('click', () => {
        form.querySelectorAll('input[type="checkbox"]').forEach(box => {
          box.checked = false
        })
        form.submit()
      })
    }

    filtersContainer.querySelectorAll('[data-filter-checkbox="true"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        form?.submit()
      })
    })
  }
}
