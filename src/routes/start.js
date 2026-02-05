export const start = {
  method: 'GET',
  path: '/',
  options: {
    auth: false
  },
  handler: function (_request, h) {
    return h.view('start')
  }
}
