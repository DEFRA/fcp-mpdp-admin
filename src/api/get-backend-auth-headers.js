import { config } from '../config/config.js'
import { getServiceToken } from '../common/helpers/service-token.js'

export function getBackendAuthHeaders () {
  if (!config.get('serviceToServiceAuth.enabled')) {
    return {}
  }
  const token = getServiceToken()
  if (!token) {
    return {}
  }
  return { authorization: `Bearer ${token}` }
}
