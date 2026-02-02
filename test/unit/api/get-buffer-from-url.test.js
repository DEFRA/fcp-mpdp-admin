import { describe, test, expect, vi, afterEach } from 'vitest'
import Wreck from '@hapi/wreck'
import { getBufferFromUrl } from '../../../src/api/get-buffer-from-url.js'
import { buildBackendUrl } from '../../../src/api/build-backend-url.js'
import { logBackendError } from '../../../src/api/log-backend-error.js'

vi.mock('@hapi/wreck')
vi.mock('../../../src/api/build-backend-url.js')
vi.mock('../../../src/api/log-backend-error.js')

describe('getBufferFromUrl', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('returns payload when Wreck.get succeeds', async () => {
    const mockUrl = '/mock/file'
    const backendUrl = 'http://fcp-mpdp-backend/mock/file'
    const mockBuffer = Buffer.from('CSV_CONTENT')

    buildBackendUrl.mockReturnValue(backendUrl)
    Wreck.get.mockResolvedValueOnce({ payload: mockBuffer })

    const response = await getBufferFromUrl(mockUrl)

    expect(buildBackendUrl).toHaveBeenCalledWith(mockUrl)
    expect(Wreck.get).toHaveBeenCalledWith(backendUrl)
    expect(response).toEqual(mockBuffer)
  })

  test('logs and rethrows error when Wreck.get fails', async () => {
    const mockUrl = '/mock/file'
    const backendUrl = 'http://fcp-mpdp-backend/mock/file'
    const mockError = new Error('Mock backend failure')

    buildBackendUrl.mockReturnValue(backendUrl)
    Wreck.get.mockRejectedValueOnce(mockError)

    await expect(getBufferFromUrl(mockUrl)).rejects.toThrow(mockError)
    expect(buildBackendUrl).toHaveBeenCalledWith(mockUrl)
    expect(logBackendError).toHaveBeenCalledWith(mockError)
  })
})
