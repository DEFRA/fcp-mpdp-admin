const showAllText = 'Show all'
const showDetailsText = 'Show details'

export default {
  init () {
    this.setupSchemeShowHideButtons()
    this.setupSummaryShowHideButton()
    this.setupShowAllButton()
  },

  setupShowAllButton () {
    const showAllButton = document.querySelector('#show-all-button')
    if (!showAllButton) {
      return
    }

    const detailsElements = document.querySelectorAll('.schemeDetails')
    const activitiesElements = document.querySelectorAll('.schemeActivity')

    showAllButton?.addEventListener('click', () => {
      const show = showAllButton.textContent === showAllText
      detailsElements.forEach((element) => {
        element.style.display = show ? 'block' : 'none'
      })

      activitiesElements.forEach((element) => {
        element.open = show
      })

      const allShowHideButtons = this.getAllSchemeShowHideButtons()
      allShowHideButtons.forEach((showHideButton, i) => {
        const schemeMoreInfo = document.getElementById(`scheme-more-info${i + 1}`)
        this.toggleDisplay(schemeMoreInfo, show)
        this.toggleDetails(showHideButton, show)
      })

      showAllButton.textContent = show ? 'Hide all' : showAllText
    })
  },

  toggleDisplay (element, show) {
    element.style.display = show ? 'block' : 'none'
  },

  toggleDetails (element, show) {
    element.textContent = show ? 'Hide details' : showDetailsText
  },

  setupSummaryShowHideButton () {
    const showHideButton = document.getElementById('summary-toggle')
    if (!showHideButton) {
      return
    }

    const summaryDetails = document.getElementById('summary-details')
    const dateRange = document.getElementById('date-range')

    this.toggleDisplay(summaryDetails, false)
    this.toggleDisplay(dateRange, false)

    showHideButton?.addEventListener('click', () => {
      const show = document.getElementById('summary-toggle').textContent === showDetailsText
      this.toggleDisplay(summaryDetails, show)
      this.toggleDisplay(dateRange, show)

      this.toggleDetails(showHideButton, show)
    })
  },

  setupSchemeShowHideButtons () {
    const allShowHideButtons = this.getAllSchemeShowHideButtons()
    if (!allShowHideButtons.length) {
      return
    }

    allShowHideButtons.forEach((showHideButton, i) => {
      if (!showHideButton) {
        return
      }

      const schemeDetails = document.getElementById(`scheme-details${i + 1}`)
      const schemeMoreInfo = document.getElementById(`scheme-more-info${i + 1}`)

      this.toggleDisplay(schemeDetails, false)
      this.toggleDisplay(schemeMoreInfo, false)

      showHideButton?.addEventListener('click', () => {
        const show = showHideButton.textContent === showDetailsText
        this.toggleDisplay(schemeDetails, show)
        this.toggleDisplay(schemeMoreInfo, show)

        this.toggleDetails(showHideButton, show)
      })
    })
  },

  getAllSchemeShowHideButtons () {
    const allButtons = []
    const schemesLength = document.getElementById('mpdp-summary-breakdown')?.getAttribute('data-schemesLength')
    for (let i = 1; i <= parseInt(schemesLength); i++) {
      allButtons.push(document.getElementById(`scheme-toggle${i}`))
    }

    return allButtons
  }
}
