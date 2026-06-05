import { config } from '../config/config.js'
import { initServiceTokenCache } from '../common/helpers/service-token.js'
import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

const serviceToken = {
  plugin: {
    name: 'service-token',
    register: async (_server) => {
      if (!config.get('serviceAuth.enabled')) {
        logger.info('Service-to-service authentication is disabled')
        return
      }
      logger.info('Initialising service-to-service token cache')
      await initServiceTokenCache()
    }
  }
}

export { serviceToken }
