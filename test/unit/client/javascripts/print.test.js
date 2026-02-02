import { beforeAll, beforeEach, describe, test, expect, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import print from '../../../../src/client/javascripts/print.js'

describe('print', () => {
  let printLink

  beforeAll(() => {
    const dom = new JSDOM()
    globalThis.document = dom.window.document
    globalThis.window = dom.window
  })

  beforeEach(() => {
    document.body.innerHTML = `
      <a id="print-link" href="#">print this page</a>
    `
    printLink = document.getElementById('print-link')
  })

  test('should add click listener to print link', () => {
    const addEventListenerSpy = vi.spyOn(printLink, 'addEventListener')

    print.init()

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function)
    )
  })

  test('should call globalThis.print and prevent default on click', () => {
    const preventDefaultSpy = vi.fn()

    if (!globalThis.print) {
      globalThis.print = () => { }
    }

    const printSpy = vi.spyOn(globalThis, 'print').mockImplementation(() => { })

    print.init()

    const event = new window.Event('click', { bubbles: true, cancelable: true })

    vi.spyOn(event, 'preventDefault').mockImplementation(preventDefaultSpy)

    printLink.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(printSpy).toHaveBeenCalled()

    printSpy.mockRestore()
  })
})
