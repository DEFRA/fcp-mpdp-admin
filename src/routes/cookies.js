import Joi from 'joi'
import { config } from '../config/config.js'
import { cookiesModel } from './models/cookies.js'
import { updatePolicy } from '../cookies.js'

export const cookies = [
  {
    method: 'GET',
    path: '/cookies',
    handler: function (request, h) {
      return h.view(
        'cookies/policy',
        {
          pageTitle: 'Cookies',
          ...cookiesModel(
            false,
            request.headers.referer,
            request.state[config.get('cookie.name')]
          )
        }
      )
    }
  },
  {
    method: 'POST',
    path: '/cookies',
    options: {
      validate: {
        payload: {
          analytics: Joi.boolean(),
          async: Joi.boolean().default(false),
          referer: Joi.string().allow('')
        }
      }
    },
    handler: function (request, h) {
      const payload = request.payload

      updatePolicy(request, h, payload.analytics)

      if (payload.async) {
        return h.response({ message: 'success' })
      }

      return h.view(
        'cookies/policy',
        {
          pageTitle: 'Cookies',
          ...cookiesModel(
            true,
            payload.referer,
            request.state[config.get('cookie.name')]
          )
        }
      )
    }
  }
]
