import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { CountryInsight, CountryJobTitleInsights } from '../api/insights'
import InsightsPage from './InsightsPage'

const countries: CountryInsight[] = [
  { country: 'IN', currency: 'INR', headcount: 120, min: 600000, median: 1500000, mean: 1700000, max: 4000000 },
  { country: 'US', currency: 'USD', headcount: 80, min: 60000, median: 120000, mean: 135000, max: 300000 },
]

const indiaJobTitles: CountryJobTitleInsights = {
  country: 'IN',
  currency: 'INR',
  items: [
    { job_title: 'Engineer', department: 'Engineering', headcount: 40, min: 900000, median: 1800000, mean: 1900000, max: 3500000 },
  ],
}

let fetchMock: Mock<(input: string, init?: RequestInit) => Promise<Response>>

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

function stubApi() {
  fetchMock = vi.fn(async (input: string) => {
    const { pathname } = new URL(input)
    if (pathname === '/insights/countries/IN/job-titles') return jsonResponse(indiaJobTitles)
    if (pathname.endsWith('/job-titles')) return jsonResponse({ country: 'US', currency: 'USD', items: [] })
    return jsonResponse(countries)
  })
  vi.stubGlobal('fetch', fetchMock)
}

function insightsRequests(path: string) {
  return fetchMock.mock.calls.map(([input]) => new URL(input)).filter((url) => url.pathname === path)
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <InsightsPage />
    </QueryClientProvider>,
  )
}

describe('InsightsPage', () => {
  beforeEach(() => stubApi())
  afterEach(() => vi.unstubAllGlobals())

  it("shows each country's name and amounts in its own currency", async () => {
    renderPage()

    const india = (await screen.findByText('India')).closest('tr')!
    expect(within(india).getByText('INR')).toBeInTheDocument()
    expect(within(india).getByText('120')).toBeInTheDocument()
    expect(within(india).getByText('₹1,500,000')).toBeInTheDocument()
    expect(within(india).getByText('₹4,000,000')).toBeInTheDocument()

    const us = screen.getByText('United States').closest('tr')!
    expect(within(us).getByText('$60,000')).toBeInTheDocument()
    expect(within(us).getByText('$135,000')).toBeInTheDocument()
  })

  it('refetches the countries when the employment type changes', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('India')
    expect(insightsRequests('/insights/countries')[0].searchParams.get('employment_type')).toBe('full_time')

    await user.click(screen.getByRole('combobox', { name: 'Employment type' }))
    await user.click(await screen.findByRole('option', { name: 'Part-time' }))

    expect(insightsRequests('/insights/countries').at(-1)!.searchParams.get('employment_type')).toBe('part_time')
  })

  it("shows a country's job-title breakdown when its row is selected", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByText('India'))

    const breakdown = await screen.findByRole('table', { name: 'Job titles in India' })
    const engineer = (await within(breakdown).findByText('Engineer')).closest('tr')!
    expect(within(engineer).getByText('Engineering')).toBeInTheDocument()
    expect(within(engineer).getByText('40')).toBeInTheDocument()
    expect(within(engineer).getByText('₹1,800,000')).toBeInTheDocument()
    expect(insightsRequests('/insights/countries/IN/job-titles')[0].searchParams.get('employment_type')).toBe('full_time')
  })

  it('shows an empty-state message when there are no employees of that type', async () => {
    fetchMock.mockImplementation(async () => jsonResponse([]))
    renderPage()

    expect(await screen.findByText('No employees of this type yet.')).toBeInTheDocument()
  })

  it('shows an error message when the insights cannot be loaded', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ detail: 'boom' }, 500))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load insights. Please try again.')
  })

  it('lets a country row be focused and selected with the keyboard', async () => {
    const user = userEvent.setup()
    renderPage()
    const india = (await screen.findByText('India')).closest('tr')!
    const us = screen.getByText('United States').closest('tr')!

    india.focus()
    expect(india).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(india).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByRole('table', { name: 'Job titles in India' })).toBeInTheDocument()

    us.focus()
    await user.keyboard(' ')
    expect(us).toHaveAttribute('aria-selected', 'true')
    expect(india).toHaveAttribute('aria-selected', 'false')
  })
})
