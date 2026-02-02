import Crumb from '@hapi/crumb'

export const crumb = {
  plugin: Crumb,
  options: {
    cookieOptions: {
      isSecure: process.env.NODE_ENV === 'production'
    }
  }
}
