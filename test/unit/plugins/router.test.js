import { describe, test, expect, vi, beforeEach } from 'vitest'
import Inert from '@hapi/inert'

vi.mock('../../../src/routes/health.js', () => ({
  health: { method: 'GET', path: '/health' }
}))

vi.mock('../../../src/routes/auth.js', () => ({
  auth: { method: 'GET', path: '/auth' }
}))

vi.mock('../../../src/routes/start.js', () => ({
  start: { method: 'GET', path: '/start' }
}))

vi.mock('../../../src/common/helpers/serve-static-files.js', () => ({
  serveStaticFiles: { method: 'GET', path: '/assets/{param*}' }
}))

vi.mock('../../../src/routes/admin/manage-payments.js', () => ({
  managePayments: { method: 'GET', path: '/admin/payments' }
}))

vi.mock('../../../src/routes/admin/add-payment.js', () => ({
  addPayment: { method: 'POST', path: '/admin/payments/add' }
}))

vi.mock('../../../src/routes/admin/edit-payment.js', () => ({
  editPayment: { method: 'POST', path: '/admin/payments/edit' }
}))

vi.mock('../../../src/routes/admin/delete-payment.js', () => ({
  deletePayment: { method: 'POST', path: '/admin/payments/delete' }
}))

vi.mock('../../../src/routes/admin/bulk-upload.js', () => ({
  bulkUpload: { method: 'POST', path: '/admin/payments/bulk-upload' }
}))

vi.mock('../../../src/routes/admin/delete-by-year.js', () => ({
  deleteByYear: { method: 'POST', path: '/admin/payments/delete-by-year' }
}))

vi.mock('../../../src/routes/admin/manage-summaries.js', () => ({
  manageSummariesRoute: { method: 'GET', path: '/admin/summary' }
}))

vi.mock('../../../src/routes/admin/add-summary.js', () => ({
  addSummaryRoute: { method: 'POST', path: '/admin/summary/add' }
}))

vi.mock('../../../src/routes/admin/edit-summary.js', () => ({
  editSummaryRoute: { method: 'POST', path: '/admin/summary/edit' }
}))

vi.mock('../../../src/routes/admin/delete-summary.js', () => ({
  deleteSummaryRoute: { method: 'POST', path: '/admin/summary/delete' }
}))

const { router } = await import('../../../src/plugins/router.js')

describe('router', () => {
  let mockServer

  beforeEach(() => {
    vi.clearAllMocks()
    mockServer = {
      register: vi.fn(),
      route: vi.fn()
    }
  })

  test('should export router plugin object', () => {
    expect(router).toBeDefined()
    expect(router.plugin).toBeDefined()
    expect(router.plugin.name).toBe('router')
    expect(typeof router.plugin.register).toBe('function')
  })

  test('should have correct plugin name', () => {
    expect(router.plugin.name).toBe('router')
  })

  test('should register Inert plugin', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.register).toHaveBeenCalledWith([Inert])
  })

  test('should register health route', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/health' })
    )
  })

  test('should register auth routes', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/auth' })
    )
  })

  test('should register start route', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/start' })
    )
  })

  test('should register admin payments routes', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/payments' })
    )
    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/payments/add' })
    )
    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/payments/edit' })
    )
    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/payments/delete' })
    )
  })

  test('should register bulk upload and delete by year routes', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/payments/bulk-upload' })
    )
    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/payments/delete-by-year' })
    )
  })

  test('should register admin summary routes', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/summary' })
    )
    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/summary/add' })
    )
    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/summary/edit' })
    )
    expect(mockServer.route).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/admin/summary/delete' })
    )
  })

  test('should register all routes after Inert registration', async () => {
    await router.plugin.register(mockServer)

    const registerCall = mockServer.register.mock.invocationCallOrder[0]
    const firstRouteCall = mockServer.route.mock.invocationCallOrder[0]

    expect(registerCall).toBeLessThan(firstRouteCall)
  })

  test('should register multiple routes', async () => {
    await router.plugin.register(mockServer)

    expect(mockServer.route.mock.calls.length).toBeGreaterThan(10)
  })
})
