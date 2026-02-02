import http2 from 'node:http2'
import { config } from '../config/config.js'
import { getCurrentPolicy, removeAnalytics } from '../cookies.js'

const { constants: httpConstants } = http2

const cookieNamePolicy = config.get('cookie.name')
const cookiePolicy = config.get('cookie.policy')

export const cookies = {
  plugin: {
    name: 'cookies',
    register: (server, _) => {
      server.state(cookieNamePolicy, cookiePolicy)

      server.ext('onPreResponse', (request, h) => {
        const statusCode = request.response.statusCode

        if (
          request.response.variety === 'view' &&
          statusCode !== httpConstants.HTTP_STATUS_FORBIDDEN &&
          statusCode !== httpConstants.HTTP_STATUS_BAD_REQUEST &&
          statusCode !== httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR &&
          request.response.source.context
        ) {
          const cookiesPolicy = getCurrentPolicy(request, h)

          request.response.source.context.cookiesPolicy = cookiesPolicy

          if ((!cookiesPolicy.analytics)) {
            removeAnalytics(request, h)
          }
        }

        return h.continue
      })
    }
  }
}
