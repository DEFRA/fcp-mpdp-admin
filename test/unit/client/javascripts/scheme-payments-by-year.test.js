import { vi, describe, beforeAll, beforeEach, test, expect } from 'vitest'
import schemePaymentsByYear from '../../../../src/client/javascripts/scheme-payments-by-year.js'
import { JSDOM } from 'jsdom'

const dom = new JSDOM()

describe('schemePaymentsByYear', () => {
  beforeAll(() => {
    global.document = dom.window.document
    global.window = dom.window
  })

  beforeEach(() => {
    document.body.innerHTML = `
          <div id="mpdp-summary-panel">
            <div>
              <div> 
                <h2 id="total-schemes">Payments from 2 schemes</h2>
              </div>
              <div> 
                <p>£99,999</p>
              </div>
            </div>
            <div id="summary-details">
            </div>
            <div>
              <div> 
                <h2 id="total-years">Over 1 financial year</h2>
                <p id="date-range">1 April 2023 to 31 March 2024</p>
              </div>
              <div> 
                <button id="payments-by-year-summary-toggle">Show details</button>
              </div>
              <div style="height:20px;" class="govuk-!-margin-bottom-1 mpdp-position-relative">
                <button id="show-all-year-payments-button">Show all</button>
              </div>
            </div>
          </div>
        `
  })

  describe('constructor', () => {
    test('should call setupAggregateSummaryShowHideButton and setupAggregateShowAllButton', () => {
      const spySetupAggregateSummaryShowHideButton = vi.spyOn(schemePaymentsByYear, 'setupAggregateSummaryShowHideButton')
      const spySetupAggregateShowAllButton = vi.spyOn(schemePaymentsByYear, 'setupAggregateShowAllButton')

      schemePaymentsByYear.init()

      expect(spySetupAggregateSummaryShowHideButton).toHaveBeenCalled()
      expect(spySetupAggregateShowAllButton).toHaveBeenCalled()
    })
  })

  describe('setupAggregateSummaryShowHideButton', () => {
    test('should hide details and date range by default', () => {
      const summaryDetails = document.getElementById('summary-details')
      const dateRange = document.getElementById('date-range')

      schemePaymentsByYear.setupAggregateSummaryShowHideButton()

      expect(summaryDetails.style.display).toBe('none')
      expect(dateRange.style.display).toBe('none')
    })

    test('should create a click event listener on showhidebutton', () => {
      const spyToggleDisplay = vi.spyOn(schemePaymentsByYear, 'toggleDisplay')
      const spyToggleDetails = vi.spyOn(schemePaymentsByYear, 'toggleDetails')

      schemePaymentsByYear.setupAggregateSummaryShowHideButton()

      document.getElementById('payments-by-year-summary-toggle').dispatchEvent(new window.MouseEvent('click'))

      expect(spyToggleDisplay).toHaveBeenCalled()
      expect(spyToggleDetails).toHaveBeenCalled()
    })
  })

  describe('toggleDisplay', () => {
    test('should toggle the classname of an element', () => {
      const element = document.createElement('div')

      schemePaymentsByYear.toggleDisplay(element)
      expect(element.style.display).toBe('none')

      schemePaymentsByYear.toggleDisplay(element)
      expect(element.style.display).toBe('block')
    })
  })

  describe('toggleDetails', () => {
    test('should toggle the innerText of an element', () => {
      const element = document.createElement('div')
      element.innerText = 'Show details'

      schemePaymentsByYear.toggleDetails(element)
      expect(element.innerText).toBe('Hide details')

      schemePaymentsByYear.toggleDetails(element)
      expect(element.innerText).toBe('Show details')
    })
  })

  describe('setupAggregateShowAllButton', () => {
    test('should toggle the innerText of the show payments button', () => {
      const button = document.getElementById('show-all-year-payments-button')

      schemePaymentsByYear.setupAggregateShowAllButton()

      button.dispatchEvent(new window.MouseEvent('click'))
      expect(button.innerText).toBe('Show all')

      button.dispatchEvent(new window.MouseEvent('click'))
      expect(button.innerText).toBe('Hide all')
    })
  })
})
