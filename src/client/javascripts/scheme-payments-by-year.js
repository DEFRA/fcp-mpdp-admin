export default {
  init () {
    this.setupAggregateSummaryShowHideButton()
    this.setupAggregateShowAllButton()
  },

  setupAggregateSummaryShowHideButton () {
    const showHideButton = document.getElementById('payments-by-year-summary-toggle')
    if (!showHideButton) {
      return
    }

    const summaryDetails = document.getElementById('summary-details')
    const dateRange = document.getElementById('date-range')

    this.toggleDisplay(summaryDetails)
    this.toggleDisplay(dateRange)

    showHideButton?.addEventListener('click', () => {
      this.toggleDisplay(summaryDetails)
      this.toggleDisplay(dateRange)
      this.toggleDetails(showHideButton)
    })
  },

  toggleDisplay (element) {
    element.style.display = element.style.display === 'none' ? 'block' : 'none'
  },

  toggleDetails (element) {
    element.innerText = element.innerText === 'Show details' ? 'Hide details' : 'Show details'
  },

  setupAggregateShowAllButton () {
    const showAllButton = document.querySelector('#show-all-year-payments-button')
    if (!showAllButton) {
      return
    }

    const activitiesElements = document.querySelectorAll('.yearly-activity')

    showAllButton?.addEventListener('click', () => {
      const showAll = showAllButton.innerText === 'Show all'
      activitiesElements.forEach(element => {
        element.open = showAll
      })

      showAllButton.innerText = showAll ? 'Hide all' : 'Show all'
    })
  }
}
