import { config } from '../config/config.js'

export function buildBackendUrl (url) {
  return `${config.get('backend.endpoint')}${config.get('backend.path')}${url}`
}
