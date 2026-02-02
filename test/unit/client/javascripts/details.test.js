import { beforeAll, beforeEach, describe, test, expect, vi } from 'vitest'
import details from '../../../../src/client/javascripts/details.js'
import { JSDOM } from 'jsdom'

const dom = new JSDOM()
const showDetailsText = 'Show details'

describe('details', () => {
  let showAllButton
  let summaryToggle
  let summaryDetails
  let dateRange

  beforeAll(() => {
    global.document = dom.window.document
    global.window = dom.window
  })

  beforeEach(() => {
    document.body.innerHTML = `
    <div id="mpdp-summary-panel">
      <div id="summary-details"></div>
      <p id="date-range"></p>
      <button id="summary-toggle">Show details</button>
    </div>

    <div id="mpdp-summary-breakdown" data-schemesLength="2">
      <div>
        <button id="show-all-button">Show all</button>
      </div>
      <button id="scheme-toggle1">Show details</button>
      <p id="scheme-more-info1"></p>
      <dl id="scheme-details1" class="schemeDetails"></dl>

      <button id="scheme-toggle2">Show details</button>
      <p id="scheme-more-info2"></p>
      <dl id="scheme-details2" class="schemeDetails"></dl>
    </div>
    `

    showAllButton = document.getElementById('show-all-button')
    summaryToggle = document.getElementById('summary-toggle')
    summaryDetails = document.getElementById('summary-details')
    dateRange = document.getElementById('date-range')

    details.init()
  })

  describe('init', () => {
    test('should initialize and call setup functions', () => {
      const spySetupSchemeShowHideButtons = vi.spyOn(details, 'setupSchemeShowHideButtons')
      const spySetupSummaryShowHideButton = vi.spyOn(details, 'setupSummaryShowHideButton')
      const spySetupShowAllButton = vi.spyOn(details, 'setupShowAllButton')

      details.init()

      expect(spySetupSchemeShowHideButtons).toHaveBeenCalled()
      expect(spySetupSummaryShowHideButton).toHaveBeenCalled()
      expect(spySetupShowAllButton).toHaveBeenCalled()
    })
  })

  describe('setupShowAllButton', () => {
    test('should toggle visibility of all elements when "Show all" button is clicked', () => {
      showAllButton.click()

      for (let i = 0; i < 2; i++) {
        expect(document.getElementById(`scheme-details${i + 1}`).style.display).toBe('block')
        expect(document.getElementById(`scheme-more-info${i + 1}`).style.display).toBe('block')
      }

      expect(showAllButton.textContent).toBe('Hide all')
    })

    test('should toggle visibility back when "Hide all" button is clicked', () => {
      showAllButton.click() // Show all
      showAllButton.click() // Hide all

      for (let i = 0; i < 2; i++) {
        expect(document.getElementById(`scheme-details${i + 1}`).style.display).toBe('none')
        expect(document.getElementById(`scheme-more-info${i + 1}`).style.display).toBe('none')
      }

      expect(showAllButton.textContent).toBe('Show all')
    })
  })

  describe('setupSummaryShowHideButton', () => {
    test('should hide summary details and date range by default', () => {
      expect(summaryDetails.style.display).toBe('none')
      expect(dateRange.style.display).toBe('none')
    })

    test('should toggle visibility of summary details when summary toggle is clicked', () => {
      summaryToggle.click()

      expect(summaryDetails.style.display).toBe('block')
      expect(dateRange.style.display).toBe('block')
      expect(summaryToggle.textContent).toBe('Hide details')
    })
  })

  describe('setupSchemeShowHideButtons', () => {
    test('should hide scheme details and more info by default', () => {
      for (let i = 0; i < 2; i++) {
        expect(document.getElementById(`scheme-details${i + 1}`).style.display).toBe('none')
        expect(document.getElementById(`scheme-more-info${i + 1}`).style.display).toBe('none')
      }
    })

    test('should toggle visibility of scheme details when individual toggle is clicked', () => {
      const schemeDetails = document.getElementById('scheme-details1')
      const schemeMoreInfo = document.getElementById('scheme-more-info1')
      const schemeToggle = document.getElementById('scheme-toggle1')

      schemeToggle.click()

      expect(schemeDetails.style.display).toBe('block')
      expect(schemeMoreInfo.style.display).toBe('block')
      expect(schemeToggle.textContent).toBe('Hide details')

      schemeToggle.click()

      expect(schemeDetails.style.display).toBe('none')
      expect(schemeMoreInfo.style.display).toBe('none')
      expect(schemeToggle.textContent).toBe('Show details')
    })
  })

  describe('toggleDisplay', () => {
    let schemeDetails

    beforeAll(() => {
      schemeDetails = document.getElementById('scheme-details1')
    })

    test('should set display to block when show is true', () => {
      details.toggleDisplay(schemeDetails, true)

      expect(schemeDetails.style.display).toBe('block')
    })

    test('should set display to none when show is false', () => {
      details.toggleDisplay(schemeDetails, false)

      expect(schemeDetails.style.display).toBe('none')
    })
  })

  describe('toggleDetails', () => {
    let schemeToggle

    beforeAll(() => {
      schemeToggle = document.getElementById('scheme-toggle1')
    })

    test('should set innerText to "Hide details" when show is true', () => {
      details.toggleDetails(schemeToggle, true)

      expect(schemeToggle.textContent).toBe('Hide details')
    })

    test('should set innerText to "Show details" when show is false', () => {
      details.toggleDetails(schemeToggle, false)

      expect(schemeToggle.textContent).toBe(showDetailsText)
    })
  })
})
