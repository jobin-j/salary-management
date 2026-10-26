import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCountryInsights, getJobTitleInsights } from './insights'

function stubFetch(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body)))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('insights api', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('requests country insights for the given employment type', async () => {
    const fetchMock = stubFetch([])

    await getCountryInsights('part_time')

    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.pathname).toBe('/insights/countries')
    expect(Object.fromEntries(url.searchParams)).toEqual({ employment_type: 'part_time' })
  })

  it("requests one country's job-title insights for the given employment type", async () => {
    const fetchMock = stubFetch({ country: 'IN', currency: 'INR', items: [] })

    await getJobTitleInsights('IN', 'all')

    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.pathname).toBe('/insights/countries/IN/job-titles')
    expect(Object.fromEntries(url.searchParams)).toEqual({ employment_type: 'all' })
  })
})
