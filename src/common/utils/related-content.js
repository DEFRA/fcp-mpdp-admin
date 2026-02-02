const relatedContentLinks = [
  {
    id: 'fflm-link',
    text: 'Funding for farmers, growers and land managers',
    url: 'https://www.gov.uk/guidance/funding-for-farmers',
    pages: ['start', 'scheme-payments-by-year', 'search', 'details']
  },
  {
    id: 'cookies-link',
    text: 'Cookies',
    url: 'https://www.gov.uk/help/cookies',
    pages: ['privacy']
  },
  {
    id: 'tc-link',
    text: 'Terms and conditions',
    url: 'https://www.gov.uk/help/terms-conditions',
    pages: ['accessibility', 'privacy']
  },
  {
    id: 'about-govuk-link',
    text: 'About GOV.UK',
    url: 'https://www.gov.uk/help/about-govuk',
    pages: ['accessibility']
  }
]

export function getRelatedContentLinks (page) {
  return relatedContentLinks.filter(relatedContent => relatedContent.pages.includes(page))
}
