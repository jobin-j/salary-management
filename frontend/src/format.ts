// navigator.language keeps formatting in the user's locale (and fixed at en-US under jsdom).
const regionNames = new Intl.DisplayNames([navigator.language], { type: 'region' })

export function countryName(code: string) {
  return regionNames.of(code) ?? code
}

export function formatSalary(amount: number, currency: string) {
  return new Intl.NumberFormat(navigator.language, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
