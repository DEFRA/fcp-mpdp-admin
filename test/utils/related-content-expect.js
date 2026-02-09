function expectRelatedContent ($) {
  const relatedContent = $('.govuk-related-navigation')
  expect(relatedContent.length).toBe(1)
}

export { expectRelatedContent }
