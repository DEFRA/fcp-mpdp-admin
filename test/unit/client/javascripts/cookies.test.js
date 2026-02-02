import { describe, test, beforeEach, beforeAll, afterEach, expect, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import cookies from '../../../../src/client/javascripts/cookies.js'

const dom = new JSDOM()

describe('cookies', () => {
  let xhrMock

  beforeAll(() => {
    globalThis.document = dom.window.document
    globalThis.window = dom.window
    globalThis.location = dom.window.location
  })

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="js-cookies-container">
        <button class="js-cookies-button-accept">Accept</button>
        <button class="js-cookies-button-reject">Reject</button>
        <div class="js-cookies-accepted" hidden>
          <button class="js-hide">Hide</button>
        </div>
        <div class="js-cookies-rejected" hidden>
          <button class="js-hide">Hide</button>
        </div>
        <div class="js-cookies-banner"></div>
        <div class="js-question-banner"></div>
      </div>
      <a href="/cookies">Cookies</a>
      <a href="/privacy">Privacy</a>
      <a href="/accessibility">Accessibility</a>
    `
    cookies.init()

    xhrMock = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn()
    }

    global.XMLHttpRequest = vi.fn(() => xhrMock)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('should show accepted banner and send correct data on accept', () => {
    const acceptButton = document.querySelector('.js-cookies-button-accept')
    const acceptedBanner = document.querySelector('.js-cookies-accepted')

    const event = new window.MouseEvent('click', { bubbles: true, cancelable: true })
    const preventDefault = vi.spyOn(window.MouseEvent.prototype, 'preventDefault')
    acceptedBanner.focus = vi.fn()

    acceptButton.dispatchEvent(event)

    expect(preventDefault).toHaveBeenCalled()
    expect(acceptedBanner.hasAttribute('hidden')).toBe(false)
    expect(acceptedBanner.focus).toHaveBeenCalled()
    expect(xhrMock.open).toHaveBeenCalledWith('POST', '/cookies', true)
    expect(xhrMock.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
    expect(xhrMock.send).toHaveBeenCalledWith(JSON.stringify({ analytics: true, async: true }))
  })

  test('should show rejected banner and send correct data on reject', () => {
    const rejectButton = document.querySelector('.js-cookies-button-reject')
    const rejectedBanner = document.querySelector('.js-cookies-rejected')

    const event = new window.MouseEvent('click', { bubbles: true, cancelable: true })
    const preventDefault = vi.spyOn(window.MouseEvent.prototype, 'preventDefault')
    rejectedBanner.focus = vi.fn()

    rejectButton.dispatchEvent(event)

    expect(preventDefault).toHaveBeenCalled()
    expect(rejectedBanner.hasAttribute('hidden')).toBe(false)
    expect(rejectedBanner.focus).toHaveBeenCalled()
    expect(xhrMock.open).toHaveBeenCalledWith('POST', '/cookies', true)
    expect(xhrMock.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
    expect(xhrMock.send).toHaveBeenCalledWith(JSON.stringify({ analytics: false, async: true }))
  })
})
