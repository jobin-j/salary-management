import { afterEach, describe, expect, it, vi } from 'vitest'
import { listEmployees } from './employees'

describe('listEmployees', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('converts the 0-based grid page to 1-based and sends only the filters that are set', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [], total: 0, page: 3, page_size: 50 })),
    )
    vi.stubGlobal('fetch', fetchMock)

    await listEmployees({ page: 2, pageSize: 50, search: '', country: 'IN', department: '', jobTitle: '' })

    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.pathname).toBe('/employees')
    expect(Object.fromEntries(url.searchParams)).toEqual({ page: '3', page_size: '50', country: 'IN' })
  })
})
