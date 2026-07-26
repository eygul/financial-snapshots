const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number): string {
  return formatter.format(value)
}

/** Same as formatCurrency but with an explicit +/- sign, for deltas like cash flow. */
export function formatSigned(value: number): string {
  const formatted = formatter.format(Math.abs(value))
  return value < 0 ? `-${formatted}` : `+${formatted}`
}
