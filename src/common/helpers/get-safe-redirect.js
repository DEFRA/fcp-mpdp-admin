function getSafeRedirect (redirect) {
  if (!redirect?.startsWith('/') || redirect.startsWith('//')) {
    return '/'
  }
  return redirect
}

export { getSafeRedirect }
