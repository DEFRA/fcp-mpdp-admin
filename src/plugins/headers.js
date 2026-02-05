export const headers = {
  plugin: {
    name: 'headers',
    register: (server, _options) => {
      server.ext('onPreResponse', (request, h) => {
        const response = request.response

        const headerLocation = response.headers || response.output?.headers

        if (headerLocation) {
          if (request.path !== '/') {
            headerLocation['X-Robots-Tag'] = 'noindex, nofollow'
          }
          headerLocation['Cross-Origin-Opener-Policy'] = 'same-origin'
          headerLocation['Cross-Origin-Embedder-Policy'] = 'require-corp'
          headerLocation['Cross-Origin-Resource-Policy'] = 'same-site'
          headerLocation['Referrer-Policy'] = 'same-origin'
          headerLocation['Permissions-Policy'] = 'camera=(), geolocation=(), magnetometer=(), microphone=(), payment=(), usb=()'
          // Disable caching for all routes except the index page and assets
          // This is to prevent browsers from caching sensitive data in the browser history
          // Prevents the back button from displaying sensitive data after the user has signed out
          if (request.path !== '/' && !request.path.startsWith('/assets')) {
          // Cache-Control must be lower case to avoid conflicts with Hapi's built-in header handling
            headerLocation['cache-control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
            headerLocation.Pragma = 'no-cache'
            headerLocation.Expires = '0'
          }
        }

        return h.continue
      })
    }
  }
}
