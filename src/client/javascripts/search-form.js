export default {
  init () {
    const form = document.getElementById('search-form')
    const searchButton = document.getElementById('search-button')

    if (!form || !searchButton) { return }

    searchButton.addEventListener('click', () => {
      form.querySelectorAll('input[type="checkbox"]').forEach(box => {
        box.checked = false
      })
    })
  }
}
