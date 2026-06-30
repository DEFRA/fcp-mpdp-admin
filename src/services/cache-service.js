import { post } from '../api/post.js'

export async function invalidateSearchCache () {
  await post('/admin/cache/invalidate', null)
}
