import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Employee } from '../api/employees'
import EmployeesPage from './EmployeesPage'

const priya: Employee = {
  id: 1,
  full_name: 'Priya Sharma',
  email: 'priya@example.com',
  job_title: 'Engineer',
  department: 'Engineering',
  country: 'IN',
  currency: 'INR',
  employment_type: 'full_time',
  annual_salary: 1500000,
  hire_date: '2022-04-01',
}

const options = {
  countries: [
    { code: 'IN', currency: 'INR' },
    { code: 'US', currency: 'USD' },
  ],
  departments: ['Engineering'],
  job_titles: ['Engineer'],
  employment_types: ['full_time', 'part_time', 'contract'],
}

let fetchMock: ReturnType<typeof vi.fn>

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

function stubApi() {
  fetchMock = vi.fn(async (input: string) => {
    const url = new URL(input)
    if (url.pathname === '/options') return jsonResponse(options)
    return jsonResponse({ items: [priya], total: 100, page: 1, page_size: 20 })
  })
  vi.stubGlobal('fetch', fetchMock)
}

function employeesRequests() {
  return fetchMock.mock.calls
    .map(([input]) => new URL(input))
    .filter((url) => url.pathname === '/employees')
}

function lastEmployeesQuery() {
  return employeesRequests().at(-1)!.searchParams
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <EmployeesPage />
    </QueryClientProvider>,
  )
}

describe('EmployeesPage', () => {
  beforeEach(() => stubApi())
  afterEach(() => vi.unstubAllGlobals())

  it('shows rows from the API with formatted salary and country name', async () => {
    renderPage()

    expect(await screen.findByText('Priya Sharma')).toBeInTheDocument()
    expect(screen.getByText('₹1,500,000')).toBeInTheDocument()
    expect(screen.getByText('India')).toBeInTheDocument()
  })

  it('refetches the first page with the selected country', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Priya Sharma')

    await user.click(screen.getByRole('button', { name: /next page/i }))
    await waitFor(() => expect(lastEmployeesQuery().get('page')).toBe('2'))

    await user.click(screen.getByRole('combobox', { name: 'Country' }))
    await user.click(await screen.findByRole('option', { name: 'India' }))

    await waitFor(() => expect(lastEmployeesQuery().get('country')).toBe('IN'))
    expect(lastEmployeesQuery().get('page')).toBe('1')
  })

  it('sends one search request after the debounce, not one per keystroke', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Priya Sharma')

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Priya')

    await waitFor(() => expect(lastEmployeesQuery().get('search')).toBe('Priya'))
    const searches = employeesRequests().filter((url) => url.searchParams.has('search'))
    expect(searches).toHaveLength(1)
  })

  it('shows an error message when the API fails', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ detail: 'boom' }, 500))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load employees/i)
  })
})
