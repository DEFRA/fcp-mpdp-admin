export default {
  init () {
    const buttons = document.querySelectorAll('[data-module="search-filter-tags"]')
    if (!buttons.length) { return }

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const filterValue = button.dataset.filterValue
        const form = document.getElementById('search-form')
        if (!form) { return }

        const checkbox = form.querySelector(`input[type="checkbox"][value="${filterValue}"]`)
        if (checkbox) { checkbox.checked = false }

        form.submit()
      })
    })
  }
}
