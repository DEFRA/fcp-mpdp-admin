export function getReadableAmount (amount) {
  if (typeof amount !== 'number') {
    return '0'
  }

  return amount.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
