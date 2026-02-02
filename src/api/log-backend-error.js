import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

export function logBackendError (backendUrl, err) {
  return logger.error(`Encountered error while calling the backend with URL: ${backendUrl}`, err)
}
