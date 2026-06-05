import { config } from '../config/config.js'
import { getServiceToken } from '../common/helpers/service-token.js'

export async function getBackendAuthHeaders () {
  if (!config.get('serviceAuth.enabled')) {
    return {}
  }
  const token = await getServiceToken()
  if (!token) {
    return {}
  }
  return { authorization: `Bearer ${token}` }
}
