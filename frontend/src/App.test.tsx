import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

describe('App', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders the Salary Management heading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    )
    expect(screen.getByRole('heading', { name: 'Salary Management' })).toBeInTheDocument()
  })
})
