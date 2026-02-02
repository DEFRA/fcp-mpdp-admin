import Blankie from 'blankie'
import { describe, test, expect } from 'vitest'
import { contentSecurityPolicy } from '../../../src/plugins/content-security-policy.js'

describe('contentSecurityPolicy', () => {
  test('should return an object', () => {
    expect(contentSecurityPolicy).toBeInstanceOf(Object)
  })

  test('should register the Blankie plugin', () => {
    expect(contentSecurityPolicy.plugin).toBe(Blankie)
  })

  test('should restrict the font src to self', () => {
    expect(contentSecurityPolicy.options.fontSrc).toEqual(['self'])
  })

  test('should restrict the img src to self and Google Analytics', () => {
    expect(contentSecurityPolicy.options.imgSrc).toEqual([
      'self',
      'https://*.googletagmanager.com',
      'https://*.google-analytics.com'
    ])
  })

  test('should restrict the script src to self, GOV.UK hash, and Google Tag Manager', () => {
    expect(contentSecurityPolicy.options.scriptSrc).toEqual([
      'self',
      "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='",
      'https://*.googletagmanager.com'
    ])
  })

  test('should restrict the style src to self', () => {
    expect(contentSecurityPolicy.options.styleSrc).toEqual(['self'])
  })

  test('should restrict the connect src to self and Google Analytics', () => {
    expect(contentSecurityPolicy.options.connectSrc).toEqual([
      'self',
      'https://www.google.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://*.googletagmanager.com'
    ])
  })

  test('should restrict the frame src to Google Tag Manager', () => {
    expect(contentSecurityPolicy.options.frameSrc).toEqual(['https://www.googletagmanager.com'])
  })

  test('should restrict the frame ancestors to self', () => {
    expect(contentSecurityPolicy.options.frameAncestors).toEqual(['self'])
  })

  test('should restrict the form action to self', () => {
    expect(contentSecurityPolicy.options.formAction).toEqual(['self'])
  })

  test('should generate nonces', () => {
    expect(contentSecurityPolicy.options.generateNonces).toBe(true)
  })
})
