import { expect } from 'vitest'
import { getRelatedContentLinks } from '../../src/common/utils/related-content.js'

export function expectRelatedContent ($, page) {
  const relatedContentLinks = getRelatedContentLinks(page)

  relatedContentLinks.forEach((link) => {
    const linkElement = $(`#${link.id}`)

    expect(linkElement).toBeDefined()
    expect(linkElement.attr('href')).toContain(link.url)
    expect(linkElement.text()).toMatch(link.text)
  })
}
