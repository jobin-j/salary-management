import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

function renderApp() {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  )
}

describe('App', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders the Salary Management heading', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'Salary Management' })).toBeInTheDocument()
  })

  it('shows the employees page by default and the insights page when its tab is clicked', async () => {
    const user = userEvent.setup()
    renderApp()

    expect(screen.getByRole('tab', { name: 'Employees', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add employee' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Insights' }))

    expect(await screen.findByText(/Median is typical pay/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add employee' })).not.toBeInTheDocument()
  })
})
