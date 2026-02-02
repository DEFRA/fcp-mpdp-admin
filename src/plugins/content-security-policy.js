import Blankie from 'blankie'

// Hash 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' is to support a GOV.UK frontend script bundled within Nunjucks macros
// https://frontend.design-system.service.gov.uk/import-javascript/#if-our-inline-javascript-snippet-is-blocked-by-a-content-security-policy

export const contentSecurityPolicy = {
  plugin: Blankie,
  options: {
    fontSrc: ['self'],
    imgSrc: ['self', 'https://*.googletagmanager.com', 'https://*.google-analytics.com'],
    scriptSrc: ['self', "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='", 'https://*.googletagmanager.com'],
    styleSrc: ['self'],
    connectSrc: ['self', 'https://www.google.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'],
    frameSrc: ['https://www.googletagmanager.com'],
    frameAncestors: ['self'],
    formAction: ['self'],
    manifestSrc: ['self'],
    generateNonces: true
  }
}
